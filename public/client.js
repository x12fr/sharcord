const socket = io();

// Get saved username and admin status from sessionStorage
const username = sessionStorage.getItem("username");
const isAdmin = sessionStorage.getItem("isAdmin") === "true";
let profilePicture = sessionStorage.getItem("profilePicture") || "default.png";

// Join with username and admin status
socket.emit("join", { username, isAdmin });

// Elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendImageBtn = document.getElementById("sendImage");
const setPfpBtn = document.getElementById("setPfp");
const adminPanel = document.getElementById("adminPanel");
const toggleAdminPanelBtn = document.getElementById("toggleAdminPanel");
const backgroundInput = document.getElementById("backgroundInput");
const soundboardBtns = document.querySelectorAll(".sound-btn");
const setBackgroundBtn = document.getElementById("setBackground");

// Show admin panel only if user is admin
if (isAdmin) {
  adminPanel.style.display = "block";
} else {
  adminPanel.style.display = "none";
}

// Toggle admin panel open/close
toggleAdminPanelBtn.addEventListener("click", () => {
  adminPanel.classList.toggle("open");
});

// Handle incoming messages
socket.on("message", data => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  const nameColor = data.isAdmin ? 'red' : 'white';
  const staffTag = data.isAdmin ? '[staff] ' : '';
  const profileImg = `<img src="${data.profilePicture}" class="profile-pic">`;

  if (data.type === 'text') {
    messageElement.innerHTML = `${profileImg} <span style="color:${nameColor}">${staffTag}${data.username}:</span> ${data.text}`;
  } else if (data.type === 'image') {
    messageElement.innerHTML = `${profileImg} <span style="color:${nameColor}">${staffTag}${data.username}:</span> <img src="${data.image}" class="chat-image">`;
  }

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Load message history
socket.on("loadMessages", msgs => {
  msgs.forEach(msg => {
    socket.emit("message", msg);
  });
});

// Send message
messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && messageInput.value.trim()) {
    socket.emit("sendMessage", {
      username,
      text: messageInput.value.trim(),
      profilePicture,
      isAdmin
    });
    messageInput.value = "";
  }
});

// Image upload
sendImageBtn.addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("sendImage", {
        username,
        image: reader.result,
        profilePicture,
        isAdmin
      });
    };
    reader.readAsDataURL(file);
  };
  fileInput.click();
});

// Set profile picture
setPfpBtn.addEventListener("click", () => {
  const url = prompt("Enter image URL for profile picture:");
  if (url) {
    profilePicture = url;
    sessionStorage.setItem("profilePicture", url);
  }
});

// Change background
setBackgroundBtn.addEventListener("click", () => {
  const url = backgroundInput.value.trim();
  if (url && isAdmin) {
    socket.emit("changeBackground", url);
    backgroundInput.value = "";
  }
});

socket.on("changeBackground", url => {
  document.body.style.backgroundImage = `url(${url})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
});

// Play audio from soundboard
soundboardBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const url = btn.getAttribute("data-url");
    if (isAdmin) {
      socket.emit("playAudio", url);
    }
  });
});

socket.on("playAudio", url => {
  const audio = new Audio(url);
  audio.play();
});
