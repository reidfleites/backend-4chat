import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { signupMail } from "./controllers/mails.js";
import HistoryModel from "./models/history.js";
import UsersModel from "./models/user.js";
import * as UsersController from "./controllers/UsersController.js";
import * as HistoriesController from "./controllers/HistoriesController.js";
import session from "express-session";
import cookieParser from "cookie-parser";

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();
const httpServer = createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  })
);

const mongoConnectString = process.env.MONGO_URI;
mongoose.connect(mongoConnectString);

app.get("/", (req, res) => {
  res.send("server is started with socket.io");
});

app.post("/history", async (req, res) => {
  const from = req.body.history.from;
  const to = req.body.history.to;
  const history = await HistoriesController.getHistory(from, to);
  res.status(200).json(history);
});

app.post("/addMessage", async (req, res) => {
  const from = req.body.message.from;
  const to = req.body.message.to;
  const text = req.body.message.text;
  const message = await HistoryModel.create({ from: from, to: to, text: text });
  res.status(200).json(message);
});

app.get("/verify/:token", async (req, res) => {
  const token = req.params.token;
  console.log(token);
  const userFound = await UsersModel.findByIdAndUpdate(
    { _id: new mongoose.Types.ObjectId(token) },
    { $set: { verified: "verified" } },
    { new: true }
  );
  if (!userFound) {
    res.json({ error: "a user ist not exist " });
  }
  res
    .writeHead(301, {
      Location: `${process.env.FRONTEND_URL}/verify`,
    })
    .end();
});

app.post("/signup", async (req, res) => {
  const username = req.body.user.name;
  const userExisted = await UsersController.getUser(username);
  const email = req.body.user.email;
  const password = req.body.user.password;
  if (userExisted) {
    res.status(400).json({ error: "user already exist" });
  } else {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    const user = await UsersModel.create({
      username: username,
      avatar: Math.floor(Math.random() * 5000),
      email: email,
      hash: hash,
      verified: "notVerified",
    });

    // send email to verify

    const verifyUrl =
      req.protocol + "://" + req.get("host") + "/verify/" + user._id;

    signupMail(user.email, verifyUrl);

    res.json({
      user: user,
      message: "Please check your email",
      verifyUrl: verifyUrl,
    });
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.user.username;
  const password = req.body.user.password;
  let user = await UsersModel.findOne({
    username: username,
    verified: "verified",
  });

  if (!user) {
    res.status(401).json({ message: "user name oder password incorrect" });
  }
  const hash = user.hash;
  bcrypt.compare(password, hash).then((result) => {
    if (result) {
      req.session.user = user;
      req.session.save();
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: "user name oder password incorrect" });
    }
  });
});

app.get("/currentUser", async (req, res) => {
  let user = req.session.user;
  res.json(user);
});

app.get("/logout", async (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: "user disconnect" });
});

app.post("/chatRoom", async (req, res) => {
  const roomName = req.body.room.roomName;
  const chatRoom = await HistoryModel.find({ to: roomName });
  res.status(200).json(chatRoom);
});
app.get("/allUsers", async (req, res) => {
  const allUsers = await UsersModel.find({});
  res.status(200).json(allUsers);
});

let onlineUsers = [];
let rooms = [
  { room: "general", newMessage: false },
  { room: "music", newMessage: false },
  { room: "sport", newMessage: false },
];
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("add user", (userId, username) => {
    const user = onlineUsers.some((user) => user.id === userId);
    if (user) {
      const index = onlineUsers.findIndex((user) => user.id === userId);
      const newUser = Object.assign(user, { socketId: socket.id });
      onlineUsers[index] = newUser;
    }
    !onlineUsers.some((user) => user.id === userId) &&
      onlineUsers.push({
        id: userId,
        username: username,
        socketId: socket.id,
        countMessage: 0,
      });
    io.emit("onlineUsers", onlineUsers);
  });
  socket.on("message", (data) => {
    console.log(data);
    const user = onlineUsers.find((user) => user.id === data.to);
    io.to(user.socketId).emit("messageArrived", data);
  });

  socket.on("join-rooms", () => {
    rooms.forEach((r) => {
      socket.join(r.room);
    });
    io.emit("rooms-list", rooms);
  });
  socket.on("chat-message", (data) => {
    io.sockets.in(data.to).emit("roomMessage", data);
  });
  socket.on("disconnect", () => {
    console.log("user disconnect");
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("onlineUsers", onlineUsers);
  });
});

httpServer.listen(5000, () => {
  console.log(`Now listening on port http://localhost:${port}`);
});
