const privateChats = {}; // Store private chat history

function appendMessage(user, text) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.innerHTML = `<strong>${user}:</strong> ${text}`;
  div.onclick = () => openPrivateChat(user);
  chat.appendChild(div);
}

function openPrivateChat(user) {
  if (user === currentUser) return; // Don't DM yourself

  const dmContainer = document.getElementById('dm-container');
  dmContainer.style.display = 'block';
  document.getElementById('dm-title').innerText = `Chat with ${user}`;
  document.getElementById('dm-messages').innerHTML = '';

  // Load existing messages
  if (privateChats[user]) {
    privateChats[user].forEach(msg => {
      const dmDiv = document.createElement('div');
      dmDiv.textContent = msg;
      document.getElementById('dm-messages').appendChild(dmDiv);
    });
  }
  
  // Set current DM target
  dmContainer.dataset.target = user;
}

function sendPrivateMessage() {
  const target = document.getElementById('dm-container').dataset.target;
  const input = document.getElementById('dm-input');
  const text = input.value.trim();
  if (text) {
    socket.emit('private message', { toUser: target, fromUser: currentUser, text });
    if (!privateChats[target]) privateChats[target] = [];
    privateChats[target].push(`You: ${text}`);
    openPrivateChat(target); // Refresh messages
    input.value = '';
  }
}

socket.on('private message', ({ fromUser, text }) => {
  if (!privateChats[fromUser]) privateChats[fromUser] = [];
  privateChats[fromUser].push(`${fromUser}: ${text}`);
  openPrivateChat(fromUser); // Auto-open on receive
});
