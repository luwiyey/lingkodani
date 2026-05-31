import { getServerFirestore } from "@/lib/firebase/server";

type FirestoreLike = ReturnType<typeof getServerFirestore>;

export const db = new Proxy({} as FirestoreLike, {
  get(_target, property) {
    const firestore = getServerFirestore();
    const value = Reflect.get(firestore as object, property);
    return typeof value === "function" ? value.bind(firestore) : value;
  },
});
