import { getApp, getApps, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

import { firebaseConfig, hasFirebaseConfig } from "@/lib/firebase/shared";

export function getClientStorage() {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase configuration is missing for live storage.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getStorage(app);
}
