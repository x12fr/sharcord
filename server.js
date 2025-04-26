const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

const users = {};
const admins = ["X12"];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ error: "Username taken" });
  }
  users[username] = { password, isAdmin: admins.includes(username) };
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ success: true, isAdmin: users[username].isAdmin });
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("admin action", (action) => {
    switch (action.type) {
      case "strobe":
        io.emit("admin action", { type: "strobe", duration: action.duration });
        break;
      case "timeout":
        io.emit("admin action", {
          type: "timeout",
          user: action.user,
          duration: action.duration,
        });
        break;
      case "kick":
        io.emit("admin action", { type: "kick", user: action.user });
        break;
      case "redirect":
        io.emit("admin action", {
          type: "redirect",
          user: action.user,
          link: action.link,
        });
        break;
      case "spam":
        io.emit("admin action", {
          type: "spam",
          user: action.user,
          count: action.count,
        });
        break;
      case "announcement":
        io.emit("admin action", { type: "announcement", text: action.text });
        break;
      case "grant_admin":
        io.emit("admin action", {
          type: "grant_admin",
          user: action.user,
          time: action.time,
        });
        break;
      case "jumpscare":
        io.emit("admin action", {
          type: "jumpscare",
          image: action.image,
          audio: action.audio,
        });
        break;
      case "clear":
        io.emit("admin action", { type: "clear" });
        break;
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
