import { Nullable } from "@/common/utils/Nullable";
import { CollectionReference } from "firebase-admin/firestore";
import { autoInjectable, inject, singleton } from "tsyringe";
import { User } from "./model";

@singleton()
@autoInjectable()
export class UserService {
  constructor(@inject("UsersCollection") private collection: CollectionReference) {}

  getUserByUsername = async (username: Nullable<string>) => {
    if (!username) return null;

    const userRes = await this.collection.where("username", "==", username).limit(1).get();
    if (userRes.empty) return null;

    const userDoc = userRes.docs[0];

    const user = userDoc?.data() as Nullable<User>;

    if (user && userDoc?.id) {
      user.id = userDoc.id;
    }

    return user;
  };

  getUserById = async (id: Nullable<string>) => {
    if (!id) return null;

    const userDoc = await this.collection.doc(id).get();

    const user = userDoc.data() as Nullable<User>;

    if (user && userDoc.id) {
      user.id = userDoc.id;
    }

    return user;
  };
}
