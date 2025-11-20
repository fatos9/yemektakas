import { firebaseAdapter as db } from "./adapters/firebaseAdapter";

export const matchService = {
  async sendRequest(data) {
    return db.create("match_requests", data);
  },

  async getIncomingRequests(userId) {
    return db.where("match_requests", [
      { field: "toUserId", op: "==", value: userId },
      { field: "status", op: "==", "value": "pending" }
    ]);
  },

  async updateRequest(id, data) {
    return db.update("match_requests", id, data);
  },
};
