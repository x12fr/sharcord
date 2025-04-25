const socket = io();
const username = localStorage.getItem("username");
let profilePic = localStorage.getItem("profilePic") || "";

document.getElementById("adminToggle").onclick = () => {
  const panel = document.getElementById("admin-panel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
};

document.getElementById("messageInput").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = document.getElementById("messageInput").value;
  socket.emit("message", { username, message, profilePic });
  document.getElementById("messageInput").value = "";
}

socket.on("message", data => {
  const box = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.innerHTML = `<img src="${data.profilePic}" class="pfp"><strong>${data.username}</strong>: ${data.message}`;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
});

function sendImage() {
  const file = document.getElementById("imageInput").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("image", { username, dataUrl: reader.result, profilePic });
    };
    reader.readAsDataURL(file);
  }
}

socket.on("image", data => {
  const box = document.getElementById("chat-box");
  const img = document.createElement("div");
  img.innerHTML = `<img src="${data.profilePic}" class="pfp"><strong>${data.username}</strong>: <img src="${data.dataUrl}" class="chat-img">`;
  box.appendChild(img);
  box.scrollTop = box.scrollHeight;
});

function clearChat() {
  socket.emit("clear");
}

socket.on("clear", () => {
  document.getElementById("chat-box").innerHTML = "";
});

function timeout() {
  const user = document.getElementById("timeoutUser").value;
  const duration = document.getElementById("timeoutDuration").value;
  socket.emit("timeout", { user, duration });
}

socket.on("timeout", data => {
  alert(`You were timed out for ${data.duration} seconds.`);
});

function redirect() {
  const user = document.getElementById("redirectUser").value;
  const link = document.getElementById("redirectLink").value;
  socket.emit("redirect", { user, link });
}

socket.on("redirect", link => {
  window.location.href = link;
});

function strobe() {
  socket.emit("strobe");
}

socket.on("strobe", () => {
  let colors = ["red", "blue", "green", "yellow", "purple"];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.background = colors[i % colors.length];
    i++;
    if (i > 20) {
      clearInterval(interval);
      document.body.style.background = "";
    }
  }, 100);
});

function jumpscare() {
  const image = document.getElementById("jumpscareImage").files[0];
  const audio = document.getElementById("jumpscareAudio").files[0];
  const readerImg = new FileReader();
  const readerAudio = new FileReader();

  readerImg.onload = () => {
    readerAudio.onload = () => {
      socket.emit("jumpscare", {
        image: readerImg.result,
        audio: readerAudio.result
      });
    };
    readerAudio.readAsDataURL(audio);
  };
  readerImg.readAsDataURL(image);
}

socket.on("jumpscare", data => {
  const img = new Image();
  img.src = data.image;
  img.className = "fullscreen-img";
  document.body.appendChild(img);
  const audio = new Audio(data.audio);
  audio.play();
  setTimeout(() => {
    img.remove();
  }, 5000);
});

function updateProfilePic() {
  const file = document.getElementById("profilePicInput").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      profilePic = reader.result;
      localStorage.setItem("profilePic", profilePic);
    };
    reader.readAsDataURL(file);
  }
}
