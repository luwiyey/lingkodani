"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";

import { isDemoMode, isLiveMode } from "@/lib/config/app-mode";
import { registeredUsers as initialUsers } from "@/lib/data";
import { getClientAuth } from "@/lib/firebase/auth-client";
import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import { hasFirebaseConfig } from "@/lib/firebase/shared";
import { getInviteLifecycleSummary } from "@/lib/invite-lifecycle";
import { clearDemoPreviewUser, DEMO_PREVIEW_EVENT, normalizeDemoProfile, readDemoPreviewUser, readOnboardingProfile } from "@/lib/onboarding";
import { syncUserOnboardingState } from "@/lib/onboarding-checklist";
import { clearAllOfflineMutations } from "@/lib/offline-outbox";
import type { User } from "@/lib/types";

const DEMO_SESSION_KEY = "demoSessionEmail";
const DEMO_SESSION_EVENT = "demo-session-change";
const LIVE_FIREBASE_CONFIG_ERROR =
  "Hindi pa kumpleto ang live Firebase web configuration ng deployment na ito. Idagdag ang lahat ng NEXT_PUBLIC_FIREBASE_* values sa Production environment variables.";

async function syncServerSession(user: FirebaseUser | null) {
  if (!isLiveMode) {
    return;
  }

  if (!user) {
    await fetch("/api/auth/session", {
      method: "DELETE",
      cache: "no-store",
    }).catch(() => {
      // Ignore cookie cleanup failures on the client.
    });
    return;
  }

  const idToken = await user.getIdToken();
  await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });
}

function mergeLiveProfile(profile: User | null) {
  const onboardingProfile = readOnboardingProfile();

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    preferredWorkspace: profile.role === "developer"
      ? "detailed"
      : onboardingProfile?.preferredWorkspace ?? profile.preferredWorkspace,
  };
}

async function fetchServerLiveProfile(user: FirebaseUser) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Hindi mabasa ang live user profile para sa account na ito."
    );
  }

  return (payload.profile ?? null) as User | null;
}

type AuthContextType = {
  currentUser: FirebaseUser | null;
  currentUserProfile: User | null;
  authLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  startDemoSession: (email: string) => void;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadDemoProfile = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sessionEmail = localStorage.getItem(DEMO_SESSION_KEY)?.trim().toLowerCase();
    const storedUsers = localStorage.getItem("users");
    const users = storedUsers ? JSON.parse(storedUsers) as User[] : initialUsers;
    const onboardingProfile = readOnboardingProfile();
    const nextProfile = sessionEmail
      ? users.find((user) => user.email.trim().toLowerCase() === sessionEmail) ?? null
      : null;
    const mergedProfile = nextProfile
      ? {
          ...normalizeDemoProfile(
            nextProfile,
            onboardingProfile?.preferredWorkspace ?? nextProfile.preferredWorkspace ?? "simple"
          ),
        }
      : null;

    setCurrentUser(null);
    setCurrentUserProfile(mergedProfile);
    setAuthError(null);
    setAuthLoading(false);
  }, []);

  const loadPreviewProfile = React.useCallback(() => {
    const previewProfile = readDemoPreviewUser();

    setCurrentUser(null);
    setCurrentUserProfile(previewProfile);
    setAuthError(null);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoProfile();
      window.addEventListener(DEMO_SESSION_EVENT, loadDemoProfile);
      window.addEventListener("storage", loadDemoProfile);

      return () => {
        window.removeEventListener(DEMO_SESSION_EVENT, loadDemoProfile);
        window.removeEventListener("storage", loadDemoProfile);
      };
    }

    if (!hasFirebaseConfig()) {
      const syncPreviewProfile = () => {
        setCurrentUser(null);
        setCurrentUserProfile(readDemoPreviewUser());
        setAuthError(LIVE_FIREBASE_CONFIG_ERROR);
        setAuthLoading(false);
      };

      syncPreviewProfile();
      window.addEventListener(DEMO_PREVIEW_EVENT, syncPreviewProfile);
      window.addEventListener("storage", syncPreviewProfile);

      return () => {
        window.removeEventListener(DEMO_PREVIEW_EVENT, syncPreviewProfile);
        window.removeEventListener("storage", syncPreviewProfile);
      };
    }

    const auth = getClientAuth();
    const db = getClientFirestore();
    let unsubscribeProfile: (() => void) | undefined;

    const handlePreviewSessionChange = () => {
      if (auth.currentUser) {
        return;
      }

      loadPreviewProfile();
    };

    window.addEventListener(DEMO_PREVIEW_EVENT, handlePreviewSessionChange);
    window.addEventListener("storage", handlePreviewSessionChange);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeProfile?.();
      setAuthError(null);
      setCurrentUser(user);

      if (!user?.uid || !user.email) {
        await syncServerSession(null);
        setCurrentUserProfile(readDemoPreviewUser());
        setAuthLoading(false);
        return;
      }

      clearDemoPreviewUser();

      const userRef = doc(db, firebaseCollections.users, user.uid);
      let serverProfile: User | null = null;

      try {
        serverProfile = await fetchServerLiveProfile(user);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Hindi mabasa ang live user profile para sa account na ito.";
        setCurrentUserProfile(null);
        setAuthError(message);
        await signOut(auth);
        setAuthLoading(false);
        return;
      }

      if (!serverProfile) {
        await syncServerSession(null);
        setCurrentUserProfile(null);
        setAuthError("Walang awtorisadong live user profile para sa account na ito.");
        await signOut(auth);
        setAuthLoading(false);
        return;
      }

      if (serverProfile.status === "disabled") {
        await syncServerSession(null);
        setCurrentUserProfile(null);
        setAuthError("Naka-disable ang account na ito.");
        await signOut(auth);
        setAuthLoading(false);
        return;
      }

      if (serverProfile.status === "pending_setup") {
        const inviteLifecycle = getInviteLifecycleSummary(serverProfile);

        if (inviteLifecycle.status === "revoked") {
          await syncServerSession(null);
          setCurrentUserProfile(null);
          setAuthError("Naka-hold muna ang setup invite na ito. Makipag-ugnayan sa developer o barangay admin para sa panibagong invite.");
          await signOut(auth);
          setAuthLoading(false);
          return;
        }

        if (inviteLifecycle.status === "expired") {
          await syncServerSession(null);
          setCurrentUserProfile(null);
          setAuthError("Paso na ang huling setup invite. Humiling ng panibagong secure setup link bago muling mag-login.");
          await signOut(auth);
          setAuthLoading(false);
          return;
        }
      }

      try {
        await syncServerSession(user);
      } catch {
        setCurrentUserProfile(null);
        setAuthError("Hindi maihanda ang secure server session para sa account na ito.");
        await signOut(auth);
        setAuthLoading(false);
        return;
      }

      setCurrentUserProfile(mergeLiveProfile(serverProfile));
      setAuthLoading(false);

      try {
        const snapshot = await getDoc(userRef);
        const existingProfile = snapshot.exists() ? (snapshot.data() as User) : serverProfile;

        await setDoc(
          userRef,
          syncUserOnboardingState({
            id: user.uid,
            uid: user.uid,
            email: user.email,
            name: user.displayName || existingProfile.name || user.email.split("@")[0],
            avatarUrl: user.photoURL ?? existingProfile.avatarUrl,
            permissions: existingProfile.permissions ?? serverProfile.permissions,
            inviteAcceptedAt:
              existingProfile.inviteAcceptedAt ??
              (existingProfile.status === "pending_setup" ? new Date().toISOString() : serverProfile.inviteAcceptedAt),
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: existingProfile.role ?? serverProfile.role,
            title: existingProfile.title ?? serverProfile.title,
            barangay: existingProfile.barangay ?? serverProfile.barangay,
            phone: existingProfile.phone ?? serverProfile.phone,
            preferredWorkspace: existingProfile.preferredWorkspace ?? serverProfile.preferredWorkspace,
            phoneVerifiedAt: existingProfile.phoneVerifiedAt ?? serverProfile.phoneVerifiedAt,
            privacyAcknowledgedAt: existingProfile.privacyAcknowledgedAt ?? serverProfile.privacyAcknowledgedAt,
            securityReviewVerifiedAt: existingProfile.securityReviewVerifiedAt ?? serverProfile.securityReviewVerifiedAt,
            onboarding: existingProfile.onboarding ?? serverProfile.onboarding,
            status: existingProfile.status ?? serverProfile.status,
            createdAt: existingProfile.createdAt ?? serverProfile.createdAt,
          } as User, existingProfile.name || user.displayName || user.email.split("@")[0]),
          { merge: true }
        );

        unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            const profile = snapshot.exists()
              ? ({
                  id: snapshot.id,
                  ...(snapshot.data() as User),
                } as User)
              : null;
            const mergedProfile = mergeLiveProfile(profile);

            if (!mergedProfile) {
              setCurrentUserProfile(null);
              setAuthError("Hindi na makita ang live user profile para sa account na ito.");
              setAuthLoading(false);
              return;
            }

            if (mergedProfile.status === "disabled") {
              setCurrentUserProfile(null);
              setAuthError("Naka-disable ang account na ito.");
              void syncServerSession(null);
              void signOut(auth);
              setAuthLoading(false);
              return;
            }

            setCurrentUserProfile(mergedProfile);
            setAuthLoading(false);
          },
          () => {
            setCurrentUserProfile((current) => current ?? mergeLiveProfile(serverProfile));
            setAuthError("Hindi tuloy-tuloy na mabasa ang live user profile. Gumagamit muna ng huling kilalang access profile.");
            setAuthLoading(false);
          }
        );
      } catch {
        setCurrentUserProfile((current) => current ?? mergeLiveProfile(serverProfile));
        setAuthError(null);
        setAuthLoading(false);
      }
    });

    return () => {
      window.removeEventListener(DEMO_PREVIEW_EVENT, handlePreviewSessionChange);
      window.removeEventListener("storage", handlePreviewSessionChange);
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, [loadDemoProfile, loadPreviewProfile]);

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    currentUserProfile,
    authLoading,
    authError,
    async signIn(email: string, password: string) {
      if (isDemoMode) {
        localStorage.setItem(DEMO_SESSION_KEY, email.trim().toLowerCase());
        window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
        return;
      }
      if (!hasFirebaseConfig()) {
        setAuthError(LIVE_FIREBASE_CONFIG_ERROR);
        throw new Error(LIVE_FIREBASE_CONFIG_ERROR);
      }
      clearDemoPreviewUser();
      const auth = getClientAuth();
      await signInWithEmailAndPassword(auth, email, password);
    },
    startDemoSession(email: string) {
      if (!isDemoMode) return;
      localStorage.setItem(DEMO_SESSION_KEY, email.trim().toLowerCase());
      window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
    },
    async signOutUser() {
      if (typeof window !== "undefined") {
        clearAllOfflineMutations(window.localStorage);
      }

      if (isDemoMode) {
        localStorage.removeItem(DEMO_SESSION_KEY);
        window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
        return;
      }
      if (isLiveMode) {
        if (!currentUser && readDemoPreviewUser()) {
          clearDemoPreviewUser();
          setCurrentUserProfile(null);
          return;
        }
        if (!hasFirebaseConfig()) {
          setAuthError(LIVE_FIREBASE_CONFIG_ERROR);
          return;
        }
        const auth = getClientAuth();
        await syncServerSession(null);
        await signOut(auth);
      }
    },
  }), [authError, authLoading, currentUser, currentUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
