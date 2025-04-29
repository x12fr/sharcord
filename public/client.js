const socket = io();
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");

const username = localStorage.getItem("username");
const isAdmin = localStorage.getItem("isAdmin") === "true";

if (!username) window.location.href = "index.html";

// Send message
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const text = messageInput.value;
    if (text.trim()) {
      socket.emit("message", { user: username, text, isAdmin });
      messageInput.value = "";
    }
  }
});

// Receive messages
socket.on("message", (data) => {
  const msg = document.createElement("div");
  const nameStyle = data.isAdmin ? "color:red" : "color:white";
  const tag = data.isAdmin ? "[staff]" : "";
  msg.innerHTML = `<strong style="${nameStyle}">${data.user} ${tag}:</strong> ${data.text}`;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Admin GUI
if (!isAdmin) {
  document.getElementById("adminToggle").style.display = "none";
}

document.getElementById("adminToggle").onclick = () => {
  const panel = document.getElementById("adminPanel");
  panel.classList.toggle("hidden");
};

function showBackgroundPrompt() {
  document.getElementById("bgPrompt").classList.toggle("hidden");
}

document.getElementById("bgUrlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const url = e.target.value;
    socket.emit("setBackground", url);
    e.target.value = "";
    document.getElementById("bgPrompt").classList.add("hidden");
  }
});

socket.on("changeBackground", (url) => {
  document.getElementById("chat-bg").style.backgroundImage = `url('${url}')`;
  document.getElementById("chat-bg").style.backgroundSize = "cover";
});

function toggleSoundboard() {
  document.getElementById("soundboard").classList.toggle("hidden");
}

function playSound(url) {
  socket.emit("playSound", url);
}

socket.on("playSound", (url) => {
  const audio = new Audio(url);
  audio.play();
});
