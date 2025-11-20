import { firebaseAdapter as db } from "./adapters/firebaseAdapter";

export const userService = {
  async getUser(id) {
    return db.getById("users", id);
  },

  async updateUser(id, data) {
    return db.update("users", id, data);
  },

  async getUserMeals(id) {
    return db.where("meals", [
      { field: "userId", op: "==", value: id },
    ]);
  },

  async saveExpoToken(id, token) {
    return db.update("users", id, { expoPushToken: token });
  },
};
