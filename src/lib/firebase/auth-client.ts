import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { firebaseConfig, hasFirebaseConfig } from "@/lib/firebase/shared";

export function getClientAuth() {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase configuration is missing for live auth.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
