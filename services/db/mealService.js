import { firebaseAdapter as db } from "./adapters/firebaseAdapter";

export const mealService = {
  async getAllMeals() {
    return db.getAll("meals");
  },

  async getMealsByUser(userId) {
    return db.where("meals", [
      { field: "userId", op: "==", value: userId },
    ]);
  },

  async getMealsByCategory(category) {
    return db.where("meals", [
      { field: "category", op: "==", value: category },
    ]);
  },

  async createMeal(data) {
    return db.create("meals", data);
  },

  async updateMeal(id, data) {
    return db.update("meals", id, data);
  },

  async deleteMeal(id) {
    return db.remove("meals", id);
  },
};
