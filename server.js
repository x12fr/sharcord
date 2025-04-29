const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname)));

const users = {}; // username -> { profilePic, isAdmin }
const messages = []; // stored message history

io.on("connection", (socket) => {
  let username = null;

  // Send chat history to newly connected user
  socket.emit("chat history", messages);

  socket.on("claim user", ({ name, profilePic, isAdmin }, callback) => {
    if (users[name]) {
      return callback(false);
    }
    username = name;
    users[username] = { profilePic, isAdmin };
    callback(true);
  });

  socket.on("chat message", (msg) => {
    if (!username) return;
    const messageData = {
      user: username,
      profilePic: users[username]?.profilePic || "",
      text: msg,
      isAdmin: users[username]?.isAdmin || false,
      type: "text",
    };
    messages.push(messageData); // save message
    io.emit("chat message", messageData);
  });

  socket.on("image message", (url) => {
    if (!username) return;
    const messageData = {
      user: username,
      profilePic: users[username]?.profilePic || "",
      url: url,
      isAdmin: users[username]?.isAdmin || false,
      type: "image",
    };
    messages.push(messageData); // save image
    io.emit("image message", messageData);
  });

  socket.on("disconnect", () => {
    if (username) delete users[username];
  });
});

http.listen(3000, () => {
  console.log("Sharcord server running on port 3000");
});
