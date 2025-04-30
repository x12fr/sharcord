const socket = io();

// Ask for username and admin key
let username = localStorage.getItem("username");
let isAdmin = false;

if (!username) {
  username = prompt("Enter your username:");
  localStorage.setItem("username", username);
}

const adminKey = prompt("Enter admin key (leave blank if not admin):");
if (adminKey === "331256444") {
  isAdmin = true;
  localStorage.setItem("isAdmin", "true");
} else {
  isAdmin = false;
  localStorage.setItem("isAdmin", "false");
}

let profilePicture = localStorage.getItem("profilePicture") || "default.png";

// Join server
socket.emit("join", { username, isAdmin });

// Elements
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

// Send message
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && messageInput.value.trim() !== "") {
    socket.emit("sendMessage", {
      username,
      text: messageInput.value.trim(),
      profilePicture,
      isAdmin,
      type: "text"
    });
    messageInput.value = "";
  }
});

// Send image
document.getElementById("sendImage").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("sendImage", {
        username,
        image: reader.result,
        profilePicture,
        isAdmin,
        type: "image"
      });
    };
    reader.readAsDataURL(input.files[0]);
  };
  input.click();
});

// Set profile picture
document.getElementById("setPfp").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      profilePicture = reader.result;
      localStorage.setItem("profilePicture", reader.result);
    };
    reader.readAsDataURL(input.files[0]);
  };
  input.click();
});

// Handle new messages
socket.on("message", data => {
  const div = document.createElement("div");
  div.className = "message";

  const sender = document.createElement("span");
  sender.innerHTML = `<strong style="color:${data.isAdmin ? 'red' : 'white'}">${data.isAdmin ? '[staff] ' : ''}${data.username}</strong>`;

  const img = document.createElement("img");
  img.src = data.profilePicture || "default.png";
  img.className = "pfp";

  div.appendChild(img);
  div.appendChild(sender);

  if (data.type === "text") {
    div.innerHTML += `: ${data.text}`;
  } else if (data.type === "image") {
    const image = document.createElement("img");
    image.src = data.image;
    image.className = "chat-image";
    div.appendChild(image);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Load message history
socket.on("loadMessages", messages => {
  messages.forEach(m => socket.emit("message", m));
});

// Admin tools
if (isAdmin) {
  document.getElementById("adminPanel").style.display = "block";

  // Toggle background section
  document.getElementById("setBgBtn").addEventListener("click", () => {
    document.getElementById("bgSetter").classList.toggle("open");
  });

  // Set background
  document.getElementById("bgUrlInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      socket.emit("changeBackground", e.target.value);
      e.target.value = "";
    }
  });

  // Toggle soundboard
  document.getElementById("toggleSoundboard").addEventListener("click", () => {
    document.getElementById("soundboard").classList.toggle("open");
  });

  // Sound buttons
  document.querySelectorAll(".sound-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const audioUrl = btn.getAttribute("data-sound");
      socket.emit("playAudio", audioUrl);
    });
  });
}

// Background and audio
socket.on("changeBackground", url => {
  document.body.style.backgroundImage = `url(${url})`;
});

socket.on("playAudio", url => {
  const audio = new Audio(url);
  audio.play();
});
