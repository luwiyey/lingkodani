import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from "@/lib/system-settings";

export async function getServerSystemSettings() {
  const snapshot = await getServerFirestore()
    .collection(firebaseCollections.systemSettings)
    .doc(SYSTEM_SETTINGS_DOCUMENT_ID)
    .get();

  return mergeSystemSettings(snapshot.exists ? snapshot.data() : null);
}
