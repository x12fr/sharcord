let socket;

function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  }).then(res => res.json()).then(data => {
    if (data.success) startChat(username, data.admin);
    else alert("Login failed");
  });
}

function register() {
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  }).then(res => res.json()).then(data => {
    if (data.success) alert("Registered! Now log in.");
    else alert("Registration failed: " + data.message);
  });
}

function startChat(username, isAdmin) {
  document.getElementById("auth").style.display = "none";
  document.getElementById("chat").style.display = "block";
  if (isAdmin) document.getElementById("adminMenu").style.display = "block";

  socket = io();
  socket.emit("join", username);

  socket.on("message", msg => {
    const div = document.createElement("div");
    div.innerText = msg;
    document.getElementById("messages").appendChild(div);
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  socket.emit("message", input.value);
  input.value = "";
}
