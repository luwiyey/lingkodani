import { doc, getDoc, setDoc } from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import { sanitizeFirestoreDocument } from "@/lib/firebase/sanitize-firestore";
import type { SystemSettingsRepository } from "@/lib/repositories/system-settings/types";
import { mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from "@/lib/system-settings";

export const liveSystemSettingsRepository: SystemSettingsRepository = {
  async getSettings() {
    const db = getClientFirestore();
    const snapshot = await getDoc(
      doc(db, firebaseCollections.systemSettings, SYSTEM_SETTINGS_DOCUMENT_ID)
    );

    return mergeSystemSettings(snapshot.exists() ? snapshot.data() : null);
  },

  async saveSettings(settings) {
    const db = getClientFirestore();
    const nextSettings = sanitizeFirestoreDocument(mergeSystemSettings(settings));
    await setDoc(
      doc(db, firebaseCollections.systemSettings, SYSTEM_SETTINGS_DOCUMENT_ID),
      nextSettings,
      { merge: true }
    );

    return nextSettings;
  },
};
