const socket = io();
const username = sessionStorage.getItem("username");

// Display username on the page
document.getElementById("usernameDisplay").textContent = username;

// Show admin controls if user is admin
if (username === "X12") {
  const adminPanel = document.getElementById("adminControls");
  if (adminPanel) adminPanel.style.display = "block";
}

// Handle sending messages
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("chatBox");

// 3 second cooldown
let canSend = true;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value || !canSend) return;

  socket.emit("chat message", {
    user: username,
    message: input.value
  });

  input.value = "";
  canSend = false;
  setTimeout(() => {
    canSend = true;
  }, 3000);
});

// Display chat messages
socket.on("chat message", (data) => {
  const item = document.createElement("div");
  item.className = "message";
  item.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// ADMIN ACTIONS
// Clear Chat
document.getElementById("clearChatBtn")?.addEventListener("click", () => {
  messages.innerHTML = "";
  socket.emit("admin action", { type: "clearChat" });
});

// Announcement
document.getElementById("announceBtn")?.addEventListener("click", () => {
  const msg = prompt("Enter announcement:");
  if (msg) {
    socket.emit("admin action", { type: "announcement", message: msg });
  }
});

// Timeout user
document.getElementById("timeoutBtn")?.addEventListener("click", () => {
  const user = prompt("Username to timeout:");
  const time = prompt("Time in seconds:");
  socket.emit("admin action", { type: "timeout", user, time });
});

// Kick user
document.getElementById("kickBtn")?.addEventListener("click", () => {
  const user = prompt("Username to kick:");
  socket.emit("admin action", { type: "kick", user });
});

// Redirect user
document.getElementById("redirectBtn")?.addEventListener("click", () => {
  const user = prompt("Username to redirect:");
  const url = prompt("URL to send them to:");
  socket.emit("admin action", { type: "redirect", user, url });
});

// Spam tabs
document.getElementById("spamBtn")?.addEventListener("click", () => {
  const user = prompt("Username to spam:");
  const count = prompt("How many tabs?");
  socket.emit("admin action", { type: "spamTabs", user, count });
});

// Jumpscare
document.getElementById("jumpscareBtn")?.addEventListener("click", () => {
  const imageUrl = prompt("Image URL:");
  const audioUrl = prompt("Audio URL:");
  socket.emit("admin action", { type: "jumpscare", imageUrl, audioUrl });
});

// Strobe screen
document.getElementById("strobeBtn")?.addEventListener("click", () => {
  const duration = prompt("Strobe duration in seconds:");
  socket.emit("admin action", { type: "strobe", duration });
});

// Receive admin actions
socket.on("admin action", (action) => {
  switch (action.type) {
    case "announcement":
      const banner = document.createElement("div");
      banner.className = "announcement";
      banner.textContent = action.message;
      document.body.prepend(banner);
      setTimeout(() => banner.remove(), 5000);
      break;

    case "clearChat":
      messages.innerHTML = "";
      break;

    case "redirect":
      if (username === action.user) window.location.href = action.url;
      break;

    case "kick":
      if (username === action.user) window.location.href = "/login";
      break;

    case "spamTabs":
      if (username === action.user) {
        for (let i = 0; i < parseInt(action.count); i++) {
          window.open("https://example.com", "_blank");
        }
      }
      break;

    case "timeout":
      if (username === action.user) {
        alert(`You've been timed out for ${action.time} seconds`);
        document.body.innerHTML = "<h1>Timed out...</h1>";
        setTimeout(() => window.location.href = "/login", action.time * 1000);
      }
      break;

    case "jumpscare":
      if (username === action.user) {
        const img = document.createElement("img");
        img.src = action.imageUrl;
        img.style.position = "fixed";
        img.style.top = "0";
        img.style.left = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.zIndex = "9999";
        img.style.objectFit = "cover";
        document.body.appendChild(img);

        const audio = new Audio(action.audioUrl);
        audio.play();

        setTimeout(() => {
          img.remove();
          audio.pause();
          window.location.href = "/chat";
        }, 3000);
      }
      break;

    case "strobe":
      if (username === action.user) {
        const colors = ["red", "blue", "green", "purple", "yellow"];
        let i = 0;
        const interval = setInterval(() => {
          document.body.style.backgroundColor = colors[i % colors.length];
          i++;
        }, 200);
        setTimeout(() => {
          clearInterval(interval);
          document.body.style.backgroundColor = "";
        }, parseInt(action.duration) * 1000);
      }
      break;
  }
});
