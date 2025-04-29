const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const messagesFile = "messages.json";

// Serve static files (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Load saved messages
let messages = [];
if (fs.existsSync(messagesFile)) {
  try {
    const data = fs.readFileSync(messagesFile);
    messages = JSON.parse(data);
  } catch (err) {
    console.error("Failed to load messages:", err);
  }
}

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send saved messages to new user
  socket.emit("load messages", messages);

  // New chat message
  socket.on("chat message", (msg) => {
    messages.push(msg);

    // Save messages
    fs.writeFile(messagesFile, JSON.stringify(messages), (err) => {
      if (err) console.error("Failed to save messages:", err);
    });

    io.emit("chat message", msg); // Broadcast to everyone
  });

  // Image messages
  socket.on("chat image", (imgData) => {
    messages.push(imgData);

    fs.writeFile(messagesFile, JSON.stringify(messages), (err) => {
      if (err) console.error("Failed to save image messages:", err);
    });

    io.emit("chat image", imgData);
  });
});

http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
