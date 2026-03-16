import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig, hasFirebaseConfig } from "@/lib/firebase/shared";

export function getClientFirestore() {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase configuration is missing for live mode.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}
