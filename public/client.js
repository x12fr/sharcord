
const socket = io();
const username = localStorage.getItem('username');
const isAdmin = localStorage.getItem('isAdmin') === "true";

if (!username) window.location.href = "login.html";
if (isAdmin) document.getElementById("adminPanel").style.display = "block";

socket.emit("join", username);

document.getElementById("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = document.getElementById("messageInput").value;
  if (msg.trim()) {
    socket.emit("message", { username, msg });
    document.getElementById("messageInput").value = "";
  }
}

socket.on("message", data => {
  const el = document.createElement("div");
  el.textContent = `${data.username}: ${data.msg}`;
  document.getElementById("messages").appendChild(el);
});

socket.on("jumpscare", () => {
  const img = document.getElementById("jumpscareImage");
  const audio = document.getElementById("jumpscareAudio");
  img.style.display = "block";
  audio.play();
  setTimeout(() => img.style.display = "none", 3000);
});

socket.on("strobe", duration => {
  let colors = ["red", "blue", "green", "yellow", "purple"];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = colors[i % colors.length];
    i++;
  }, 200);
  setTimeout(() => {
    clearInterval(interval);
    document.body.style.backgroundColor = "#111";
  }, duration * 1000);
});

socket.on("kick", () => {
  alert("You were kicked by admin.");
  window.location.href = "/";
});

socket.on("timeout", time => {
  document.getElementById("messageInput").disabled = true;
  setTimeout(() => {
    document.getElementById("messageInput").disabled = false;
  }, time * 1000);
});

socket.on("redirect", url => {
  window.location.href = url;
});

function kickUser() {
  const user = document.getElementById("kickUser").value;
  socket.emit("kickUser", user);
}

function timeoutUser() {
  const user = document.getElementById("timeoutUser").value;
  const duration = parseInt(document.getElementById("timeoutDuration").value);
  socket.emit("timeoutUser", { user, duration });
}

function redirectUser() {
  const user = document.getElementById("redirectUser").value;
  const link = document.getElementById("redirectLink").value;
  socket.emit("redirectUser", { user, link });
}

document.getElementById("jumpscareBtn").onclick = () => socket.emit("jumpscare");
document.getElementById("strobeBtn").onclick = () => {
  const dur = parseInt(document.getElementById("strobeDuration").value);
  socket.emit("strobe", dur);
};
