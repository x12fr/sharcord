const socket = io();

const username = localStorage.getItem("username");
const isAdmin = localStorage.getItem("isAdmin") === "true";
let profilePicture = localStorage.getItem("profilePicture") || "default.png";

// Join chat
socket.emit("join", { username, isAdmin });

// Message input
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

// Send message on Enter
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && messageInput.value.trim() !== "") {
    socket.emit("sendMessage", {
      username,
      text: messageInput.value.trim(),
      profilePicture,
      isAdmin
    });
    messageInput.value = "";
  }
});

// Send image
document.getElementById("sendImage").addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("sendImage", {
        username,
        image: reader.result,
        profilePicture,
        isAdmin
      });
    };
    reader.readAsDataURL(fileInput.files[0]);
  };
  fileInput.click();
});

// Set profile picture
document.getElementById("setPfp").addEventListener("click", () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = () => {
    const reader = new FileReader();
    reader.onload = () => {
      profilePicture = reader.result;
      localStorage.setItem("profilePicture", reader.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  };
  fileInput.click();
});

// Show message
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

// Load saved messages
socket.on("loadMessages", messages => {
  messages.forEach(m => socket.emit("message", m));
});

// Admin-only tools
if (isAdmin) {
  document.getElementById("adminPanel").style.display = "block";

  // Background setter
  document.getElementById("setBgBtn").addEventListener("click", () => {
    document.getElementById("bgSetter").classList.toggle("open");
  });

  document.getElementById("bgUrlInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      socket.emit("changeBackground", e.target.value);
      e.target.value = "";
    }
  });

  // Soundboard toggle
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

// Play background and audio
socket.on("changeBackground", url => {
  document.body.style.backgroundImage = `url(${url})`;
});

socket.on("playAudio", url => {
  const audio = new Audio(url);
  audio.play();
});
