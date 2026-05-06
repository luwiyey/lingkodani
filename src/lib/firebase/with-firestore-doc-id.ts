import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export function withFirestoreDocId<T extends { id?: string }>(
  snapshot: QueryDocumentSnapshot<DocumentData>
): T {
  return {
    ...(snapshot.data() as T),
    id: snapshot.id,
  };
}
