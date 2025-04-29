const socket = io();

let currentUsername = localStorage.getItem("username") || "";
let currentProfilePic = localStorage.getItem("profilePic") || "";
let isAdmin = localStorage.getItem("isAdmin") === "true";

// Claim username
document.getElementById("claimBtn")?.addEventListener("click", () => {
  const userInput = document.getElementById("usernameInput").value.trim();
  const adminKey = document.getElementById("adminKeyInput")?.value.trim();
  if (!userInput) return;

  socket.emit("claim username", { username: userInput, adminKey }, (response) => {
    if (response.success) {
      localStorage.setItem("username", userInput);
      localStorage.setItem("isAdmin", response.isAdmin);
      window.location.href = "chat.html";
    } else {
      alert(response.message);
    }
  });
});

// Load previous messages
socket.on("load messages", (messages) => {
  messages.forEach((msg) => {
    if (msg.type === "image") {
      addImageMessage(msg.username, msg.url, msg.profilePic);
    } else {
      addMessage(msg.username, msg.text, msg.profilePic, msg.isAdmin);
    }
  });
});

// Handle message send
const form = document.getElementById("form");
const input = document.getElementById("input");

form?.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit("chat message", {
      type: "text",
      username: currentUsername,
      text: input.value.trim(),
      profilePic: currentProfilePic,
      isAdmin
    });
    input.value = "";
  }
});

// Handle sending images
document.getElementById("sendImageBtn")?.addEventListener("click", () => {
  const imageInput = document.getElementById("imageInput").value.trim();
  if (imageInput) {
    socket.emit("chat image", {
      type: "image",
      username: currentUsername,
      url: imageInput,
      profilePic: currentProfilePic
    });
    document.getElementById("imageInput").value = "";
  }
});

// Set profile picture
document.getElementById("setPfpBtn")?.addEventListener("click", () => {
  const pfpUrl = document.getElementById("pfpInput").value.trim();
  if (pfpUrl) {
    currentProfilePic = pfpUrl;
    localStorage.setItem("profilePic", pfpUrl);
    alert("Profile picture updated!");
  }
});

// Receive new message
socket.on("chat message", (msg) => {
  addMessage(msg.username, msg.text, msg.profilePic, msg.isAdmin);
});

socket.on("chat image", (msg) => {
  addImageMessage(msg.username, msg.url, msg.profilePic);
});

// Add text message to DOM
function addMessage(username, text, profilePic, isAdmin) {
  const item = document.createElement("div");
  item.classList.add("message");

  const img = document.createElement("img");
  img.src = profilePic || "";
  img.alt = "pfp";
  img.className = "pfp";

  const name = document.createElement("strong");
  name.textContent = username;
  if (isAdmin) {
    name.style.color = "red";
    name.textContent += " [administrator]";
  }

  const msg = document.createElement("span");
  msg.textContent = `: ${text}`;

  item.appendChild(img);
  item.appendChild(name);
  item.appendChild(msg);
  document.getElementById("messages").appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

// Add image message to DOM
function addImageMessage(username, url, profilePic) {
  const item = document.createElement("div");
  item.classList.add("message");

  const img = document.createElement("img");
  img.src = profilePic || "";
  img.alt = "pfp";
  img.className = "pfp";

  const name = document.createElement("strong");
  name.textContent = username;

  const image = document.createElement("img");
  image.src = url;
  image.alt = "chat image";
  image.className = "chat-img";

  item.appendChild(img);
  item.appendChild(name);
  item.appendChild(image);
  document.getElementById("messages").appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}
