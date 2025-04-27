const socket = io();
let myUsername = localStorage.getItem('username') || '';
let myPfp = localStorage.getItem('profilePic') || '';
let cooldown = false;
let isAdmin = (myUsername === "X12");
let pImageVisible = false;

// Set username and PFP on connect
socket.emit('setUsername', { username: myUsername, profilePic: myPfp });

// Admin panel toggle with "]"
document.addEventListener('keydown', (e) => {
  if (e.key === "]" && isAdmin) {
    document.getElementById('adminPanel').classList.toggle('hidden');
  }
});

// "P" image toggle (admin only)
document.addEventListener('keydown', (e) => {
  if (e.key === "p" && isAdmin) {
    if (document.activeElement.id === "messageInput") return;
    pImageVisible = !pImageVisible;
    document.getElementById('pImage').classList.toggle('hidden', !pImageVisible);
  }
});

function sendMessage() {
  if (cooldown) return;
  const message = document.getElementById('messageInput').value;
  const imageUrl = document.getElementById('imageUrl').value;

  if (imageUrl.trim() !== '') {
    socket.emit('sendImage', { username: myUsername, imageUrl: imageUrl, pfp: myPfp });
  } else if (message.trim() !== '') {
    socket.emit('chatMessage', { username: myUsername, text: message, pfp: myPfp });
  }

  document.getElementById('messageInput').value = '';
  document.getElementById('imageUrl').value = '';

  cooldown = true;
  setTimeout(() => cooldown = false, 3000);
}

function updateProfilePic() {
  const newPfp = document.getElementById('profilePicUrl').value;
  if (newPfp.trim() !== '') {
    myPfp = newPfp;
    localStorage.setItem('profilePic', newPfp);
    socket.emit('setUsername', { username: myUsername, profilePic: myPfp });
  }
}

// Admin functions
function strobeAll() {
  socket.emit('strobeAll');
}

function playAudio() {
  const url = document.getElementById('audioUrl').value;
  socket.emit('playAudio', url);
}

function timeoutUser() {
  const user = document.getElementById('timeoutUser').value;
  const seconds = document.getElementById('timeoutSeconds').value;
  socket.emit('timeoutUser', { user, seconds });
}

function redirectUser() {
  const user = document.getElementById('redirectUser').value;
  const link = document.getElementById('redirectLink').value;
  socket.emit('redirectUser', { user, url: link });
}

function changeUserPfp() {
  const user = document.getElementById('changePfpUser').value;
  const newPfp = document.getElementById('newPfp').value;
  socket.emit('changeUserPfp', { user, newPfp });
}

function jumpscare() {
  const imageUrl = document.getElementById('jumpscareImg').value;
  const audioUrl = document.getElementById('jumpscareAudio').value;
  socket.emit('jumpscare', { imageUrl, audioUrl });
}

// Listen for messages
socket.on('chatMessage', (data) => {
  const chatBox = document.getElementById('chatBox');
  const el = document.createElement('div');
  el.innerHTML = `<img src="${data.pfp}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;"> <strong>${data.username}</strong>: ${linkify(data.text)}`;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('imageMessage', (data) => {
  const chatBox = document.getElementById('chatBox');
  const el = document.createElement('div');
  el.innerHTML = `<img src="${data.pfp}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;"> <strong>${data.username}</strong>:<br><img src="${data.imageUrl}" style="max-width:200px;">`;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('strobeAll', () => {
  let colors = ['red', 'blue', 'green', 'yellow', 'purple'];
  let count = 0;
  let interval = setInterval(() => {
    document.body.style.backgroundColor = colors[count % colors.length];
    count++;
    if (count > 10) {
      clearInterval(interval);
      document.body.style.backgroundColor = 'black';
    }
  }, 300);
});

socket.on('playAudio', (url) => {
  const audio = document.getElementById('audioPlayer');
  audio.src = url;
  audio.play();
});

socket.on('timeout', (seconds) => {
  document.body.innerHTML = `<h1>You've been timed out for ${seconds} seconds</h1>`;
  setTimeout(() => {
    location.reload();
  }, seconds * 1000);
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

socket.on('changePfp', (newPfp) => {
  myPfp = newPfp;
  localStorage.setItem('profilePic', newPfp);
});

socket.on('jumpscare', ({ imageUrl, audioUrl }) => {
  const overlay = document.getElementById('jumpscareOverlay');
  overlay.innerHTML = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;">`;
  overlay.classList.remove('hidden');

  const audio = document.getElementById('audioPlayer');
  audio.src = audioUrl;
  audio.play();

  setTimeout(() => {
    overlay.classList.add('hidden');
  }, 5000);
});

// Linkify URLs in chat
function linkify(text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });
}
