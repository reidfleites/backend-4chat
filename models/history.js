import mongoose from "mongoose";

const usersSchema = mongoose.Schema(
  {
    from: String,
    to: String,
    text: String,
  },
  { timestamps: true, collection: "history" }
);
const HistoriesModel = mongoose.model("Histories", usersSchema);
export default HistoriesModel;
