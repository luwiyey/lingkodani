import { applicationDefault, cert, getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp, type App as AdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import firebaseAdminCredentialHelpers from "@/lib/firebase/admin-credentials";

const { firebaseAdminCredentialHelpText, resolveFirebaseAdminCredentials } = firebaseAdminCredentialHelpers;

type ResolvedApplicationDefaultCredentials = {
  kind: "applicationDefault";
  projectId?: string | null;
};

type ResolvedServiceAccountCredentials = {
  kind: "cert";
  projectId: string;
  serviceAccount: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
};

function getServerAdminApp(): AdminApp {
  const resolvedCredentials = resolveFirebaseAdminCredentials(process.env) as
    | ResolvedApplicationDefaultCredentials
    | ResolvedServiceAccountCredentials
    | null;

  if (!resolvedCredentials) {
    throw new Error(firebaseAdminCredentialHelpText);
  }

  const appOptions =
    resolvedCredentials.kind === "applicationDefault"
      ? {
          credential: applicationDefault(),
          ...(resolvedCredentials.projectId ? { projectId: resolvedCredentials.projectId } : {}),
        }
      : {
          credential: cert(resolvedCredentials.serviceAccount),
          projectId: resolvedCredentials.projectId,
        };

  return getAdminApps().length > 0
    ? getAdminApp()
    : initializeAdminApp(appOptions);
}

export function getServerFirestore() {
  return getAdminFirestore(getServerAdminApp());
}

export function getServerAuth() {
  return getAdminAuth(getServerAdminApp());
}
