import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { UserRepository } from "@/lib/repositories/users/types";
import type { User } from "@/lib/types";
import { getUserRecordId } from "@/lib/user-record";

export const liveUserRepository: UserRepository = {
  async listUsers() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.users), orderBy("name", "asc"))
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as User),
    }));
  },

  async createUser(user) {
    const db = getClientFirestore();
    const userId = getUserRecordId(user);
    const nextUser = {
      ...user,
      id: userId,
      uid: user.uid ?? userId,
    };
    await setDoc(doc(db, firebaseCollections.users, userId), nextUser);
    return nextUser;
  },

  async updateUser(userId, user) {
    const db = getClientFirestore();
    const nextUser = {
      ...user,
      id: user.id ?? user.uid ?? userId,
      uid: user.uid ?? user.id ?? userId,
    };
    await setDoc(doc(db, firebaseCollections.users, userId), nextUser, { merge: true });
    return nextUser;
  },

  async deleteUser(userId) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, firebaseCollections.users, userId));
  },
};
