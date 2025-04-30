const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const PORT = process.env.PORT || 3000;
const adminKey = "331256444";

let messages = [];

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  socket.on("join", ({ username, isAdmin }) => {
    socket.username = username;
    socket.isAdmin = isAdmin;
    socket.emit("loadMessages", messages);
  });

  socket.on("sendMessage", (data) => {
    const msg = {
      username: data.username,
      text: data.text,
      profilePicture: data.profilePicture,
      isAdmin: data.isAdmin,
      type: "text"
    };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    io.emit("message", msg);
  });

  socket.on("sendImage", (data) => {
    const img = {
      username: data.username,
      image: data.image,
      profilePicture: data.profilePicture,
      isAdmin: data.isAdmin,
      type: "image"
    };
    messages.push(img);
    if (messages.length > 100) messages.shift();
    io.emit("message", img);
  });

  socket.on("playAudio", (url) => {
    io.emit("playAudio", url);
  });

  socket.on("changeBackground", (url) => {
    io.emit("changeBackground", url);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
