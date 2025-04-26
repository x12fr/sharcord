const socket = io();
const username = sessionStorage.getItem("username");
const isAdmin = username === "X12";

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const adminPanel = document.getElementById("admin-panel");

if (isAdmin && adminPanel) {
  adminPanel.style.display = "block";
}

// Send messages
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (messageInput.value.trim() !== "") {
    socket.emit("chat message", {
      username,
      message: messageInput.value.trim(),
    });
    messageInput.value = "";
  }
});

// Display messages
socket.on("chat message", (data) => {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${data.username}: ${data.message}`;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// ADMIN FUNCTIONS

function sendStrobe() {
  const duration = parseInt(document.getElementById("strobeDuration").value);
  socket.emit("admin action", { type: "strobe", duration });
}

function timeoutUser() {
  const user = document.getElementById("timeoutUser").value;
  const seconds = parseInt(document.getElementById("timeoutDuration").value);
  socket.emit("admin action", { type: "timeout", user, duration: seconds });
}

function kickUser() {
  const user = document.getElementById("kickUser").value;
  socket.emit("admin action", { type: "kick", user });
}

function redirectUser() {
  const user = document.getElementById("redirectUser").value;
  const link = document.getElementById("redirectLink").value;
  socket.emit("admin action", { type: "redirect", user, link });
}

function spamUser() {
  const user = document.getElementById("spamUser").value;
  const count = parseInt(document.getElementById("spamCount").value);
  socket.emit("admin action", { type: "spam", user, count });
}

function sendAnnouncement() {
  const text = document.getElementById("announcementText").value;
  socket.emit("admin action", { type: "announcement", text });
}

function grantAdmin() {
  const user = document.getElementById("grantAdminUser").value;
  const time = parseInt(document.getElementById("grantAdminTime").value);
  socket.emit("admin action", { type: "grant_admin", user, time });
}

function sendJumpScare() {
  const image = document.getElementById("jumpscareImg").value;
  const audio = document.getElementById("jumpscareAudio").value;
  socket.emit("admin action", { type: "jumpscare", image, audio });
}

function clearChat() {
  socket.emit("admin action", { type: "clear" });
  messagesContainer.innerHTML = "";
}

// ACTIONS FROM SERVER

socket.on("admin action", (action) => {
  if (action.type === "strobe") {
    const interval = setInterval(() => {
      document.body.style.backgroundColor =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      document.body.style.backgroundColor = "";
    }, action.duration);
  }

  if (action.type === "timeout" && action.user === username) {
    alert(`You have been timed out for ${action.duration} seconds`);
    document.body.innerHTML = `<h1>You are timed out</h1>`;
    setTimeout(() => location.reload(), action.duration * 1000);
  }

  if (action.type === "kick" && action.user === username) {
    alert("You have been kicked");
    window.location.href = "https://google.com";
  }

  if (action.type === "redirect" && action.user === username) {
    window.location.href = action.link;
  }

  if (action.type === "spam" && action.user === username) {
    for (let i = 0; i < action.count; i++) {
      window.open(window.location.href, "_blank");
    }
  }

  if (action.type === "announcement") {
    alert(`Announcement: ${action.text}`);
  }

  if (action.type === "grant_admin" && action.user === username) {
    alert("You are now temporary admin!");
    adminPanel.style.display = "block";
    setTimeout(() => {
      alert("Admin access revoked.");
      adminPanel.style.display = "none";
    }, action.time * 1000);
  }

  if (action.type === "jumpscare") {
    const screen = document.getElementById("jumpscare-screen");
    const img = document.getElementById("jumpscare-img");
    const audio = document.getElementById("jumpscare-audio");

    img.src = action.image;
    audio.src = action.audio;

    screen.style.display = "flex";

    setTimeout(() => {
      screen.style.display = "none";
    }, 3000);
  }

  if (action.type === "clear") {
    messagesContainer.innerHTML = "";
  }
});
