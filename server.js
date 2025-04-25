const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));
app.use(express.json());

const users = {};
const passwords = {};

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.json({ success: false, message: "Username already taken" });
  users[username] = username;
  passwords[username] = password;
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (passwords[username] === password) {
    res.json({ success: true, admin: username === "X12" && password === "331256444" });
  } else {
    res.json({ success: false });
  }
});

io.on("connection", (socket) => {
  let user = "Anonymous";
  socket.on("join", (username) => {
    user = username;
    io.emit("message", `${user} joined the chat`);
  });
  socket.on("message", (msg) => {
    io.emit("message", `${user}: ${msg}`);
  });
});

server.listen(3000, () => {
  console.log("Sharcord running on http://localhost:3000");
});
