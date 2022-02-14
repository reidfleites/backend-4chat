import HistoriesModel from "../models/history.js";

export const getHistory = async (from, to) => {
  const history = await HistoriesModel.find({
    $or: [
      { from: from, to: to },
      { from: to, to: from },
    ],
  });
  return history;
};

export const getChatRoom = async () => {
  const chatRoom = await HistoriesModel.find({ to: "general" });
  return chatRoom;
};
