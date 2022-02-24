import mongoose from "mongoose";

const usersSchema = mongoose.Schema(
  {
    username: String,
    email: String,
    avatar: Number,
    password: String,
    hash: String,
    verified: String,
  },
  { collection: "user" ,versionKey:false}
);
const UsersModel = mongoose.model("Users", usersSchema);
export default UsersModel;
