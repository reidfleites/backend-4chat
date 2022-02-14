import UsersModel from "../models/user.js";

export const getUser = async (username) => {
  const user = await UsersModel.findOne({ username });
  return user;
};
