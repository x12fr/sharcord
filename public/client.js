const socket = io();
let username = null;
let isAdmin = false;
let isOwner = false;

function login() {
  username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/login", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      document.getElementById("login-box").style.display = "none";
      document.getElementById("chat-section").style.display = "block";
      socket.emit("register-user", username);
      isAdmin = data.isAdmin;
      isOwner = data.isOwner;
    } else {
      alert(data.message);
    }
  });
}

function sendMessage() {
  const msg = document.getElementById("msg").value;
  if (!msg.trim()) return;
  socket.emit("send-message", msg);
  document.getElementById("msg").value = "";
}

socket.on("chat-message", data => {
  const chat = document.getElementById("chat-box");
  const msgEl = document.createElement("div");
  msgEl.textContent = `${data.user}: ${data.message}`;
  msgEl.onclick = () => openPrivateChat(data.user);
  chat.appendChild(msgEl);
});

function openPrivateChat(targetUser) {
  const msg = prompt(`Private message to ${targetUser}:`);
  if (msg) socket.emit("private-message", { to: targetUser, message: msg });
}

socket.on("private-message", data => {
  alert(`Private message from ${data.from}: ${data.message}`);
});

socket.on("announcement", msg => {
  document.getElementById("announcement-bar").textContent = msg;
});

socket.on("flash-screen", duration => {
  const flash = document.createElement("div");
  flash.style.position = "fixed";
  flash.style.top = 0;
  flash.style.left = 0;
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.background = "white";
  flash.style.zIndex = 9999;
  document.body.appendChild(flash);
  setTimeout(() => document.body.removeChild(flash), duration || 2000);
});

socket.on("redirect", url => window.location.href = url);
socket.on("timeout", duration => {
  alert(`You’ve been timed out for ${duration} seconds`);
});

socket.on("kick", () => {
  alert("You were kicked from the server");
  window.location.reload();
});

socket.on("jumpscare", imgUrl => {
  const img = document.createElement("img");
  img.src = imgUrl;
  img.style.position = "fixed";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.top = 0;
  img.style.left = 0;
  img.style.zIndex = 10000;
  document.body.appendChild(img);
  setTimeout(() => document.body.removeChild(img), 3000);
});