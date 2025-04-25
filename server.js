const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const fs = require("fs");

app.use(express.static("."));
app.use(express.json());

let users = {};
const ADMIN = { user: "X12", pass: "331256444" };

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.json({ success: false, message: "Taken" });
  users[username] = { password };
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const isAdmin = username === ADMIN.user && password === ADMIN.pass;
  if (!users[username] && !isAdmin) return res.json({ success: false, message: "User not found" });
  if ((users[username] && users[username].password !== password) && !isAdmin)
    return res.json({ success: false, message: "Wrong password" });
  res.json({ success: true });
});

io.on("connection", socket => {
  socket.on("message", data => io.emit("message", data));
  socket.on("image", data => io.emit("image", data));
  socket.on("clear", () => io.emit("clear"));
  socket.on("timeout", data => io.to(data.user).emit("timeout", data));
  socket.on("redirect", data => io.to(data.user).emit("redirect", data.link));
  socket.on("strobe", () => io.emit("strobe"));
  socket.on("jumpscare", data => io.emit("jumpscare", data));
});

http.listen(3000, () => console.log("Sharcord running on port 3000"));
