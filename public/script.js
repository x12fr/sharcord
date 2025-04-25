const socket = io();
const messages = document.getElementById("messages");
const input = document.getElementById("input");
const user = document.getElementById("user");
const send = document.getElementById("send");

send.onclick = () => {
  if (input.value && user.value) {
    socket.emit("chat message", {
      user: user.value,
      message: input.value
    });
    input.value = "";
  }
};

socket.on("chat message", ({ user, message }) => {
  const msg = document.createElement("div");
  msg.textContent = `${user}: ${message}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
});
