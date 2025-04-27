const socket = io();
let username = localStorage.getItem("username");
let isAdmin = username === "X12";
let canSendMessage = true;

// If not logged in, redirect
if (!username) {
    window.location.href = "/";
}

document.getElementById("messageInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// ADMIN PANEL TOGGLE
document.addEventListener('keydown', function (e) {
    if (e.key === ']') {
        if (isAdmin) {
            const panel = document.getElementById('adminPanel');
            if (panel.style.display === "none") {
                panel.style.display = "block";
            } else {
                panel.style.display = "none";
            }
        }
    }
});

function sendMessage() {
    if (!canSendMessage) return;

    const message = document.getElementById("messageInput").value;
    const imageFile = document.getElementById("imageInput").files[0];
    const profilePicUrl = document.getElementById("profilePicInput").value;

    if (profilePicUrl) {
        socket.emit("setProfilePic", profilePicUrl);
        document.getElementById("profilePicInput").value = '';
    }

    if (message.trim() !== "") {
        socket.emit("chatMessage", message);
        document.getElementById("messageInput").value = "";
    }

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            socket.emit("chatImage", e.target.result);
        };
        reader.readAsDataURL(imageFile);
        document.getElementById("imageInput").value = "";
    }

    canSendMessage = false;
    setTimeout(() => {
        canSendMessage = true;
    }, 3000); // 3 second cooldown
}

socket.on("chatMessage", (data) => {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.innerHTML = `<strong><img src="${data.profilePic}" style="width:20px;height:20px;border-radius:50%;"> ${data.username}:</strong> ${formatLinks(data.message)}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("chatImage", (data) => {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.innerHTML = `<strong><img src="${data.profilePic}" style="width:20px;height:20px;border-radius:50%;"> ${data.username}:</strong><br><img src="${data.image}" style="max-width:200px;">`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
});

function formatLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" style="color:yellow;">${url}</a>`);
}

// Admin functions
function strobeAll() {
    socket.emit("adminStrobe");
}

function playAudio() {
    const url = document.getElementById("audioUrl").value;
    socket.emit("adminAudio", url);
}

function timeoutUser() {
    const user = document.getElementById("timeoutUser").value;
    const duration = document.getElementById("timeoutDuration").value;
    socket.emit("adminTimeout", { user, duration });
}

function redirectUser() {
    const user = document.getElementById("redirectUser").value;
    const link = document.getElementById("redirectLink").value;
    socket.emit("adminRedirect", { user, link });
}

function changePFP() {
    const user = document.getElementById("pfpUser").value;
    const url = document.getElementById("pfpUrl").value;
    socket.emit("adminChangePFP", { user, url });
}

function jumpScare() {
    const img = document.getElementById("jumpImg").value;
    const audio = document.getElementById("jumpAudio").value;
    socket.emit("adminJumpScare", { img, audio });
}

socket.on("strobe", () => {
    let colors = ["red", "yellow", "black"];
    let i = 0;
    let interval = setInterval(() => {
        document.body.style.backgroundColor = colors[i % colors.length];
        i++;
    }, 100);
    setTimeout(() => {
        clearInterval(interval);
        document.body.style.backgroundColor = "black";
    }, 3000);
});

socket.on("playAudio", (url) => {
    const audio = new Audio(url);
    audio.play();
});

socket.on("redirect", (link) => {
    window.location.href = link;
});

socket.on("timeout", (duration) => {
    const input = document.getElementById("messageInput");
    input.disabled = true;
    setTimeout(() => {
        input.disabled = false;
    }, duration * 1000);
});

socket.on("updatePFP", (url) => {
    // Profile pic updated in next messages sent
});

socket.on("jumpScare", (data) => {
    const screen = document.getElementById("jumpscareScreen");
    const img = document.getElementById("jumpscareImage");
    img.src = data.img;
    screen.style.display = "flex";
    const audio = new Audio(data.audio);
    audio.play();
    setTimeout(() => {
        screen.style.display = "none";
    }, 5000);
});
