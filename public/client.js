const socket = io();

const username = sessionStorage.getItem('username');
let profilePic = sessionStorage.getItem('profilePic') || '';

document.getElementById('message-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('m');
  if (input.value) {
    socket.emit('chat message', { username, message: input.value, profilePic });
    input.value = '';
  }
});

// Change PFP
function changePfp() {
  const fileInput = document.getElementById('pfp-input');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePic = e.target.result;
      sessionStorage.setItem('profilePic', profilePic);
      alert('Profile picture updated!');
    };
    reader.readAsDataURL(file);
  }
}

// Handle receiving messages
socket.on('chat message', (data) => {
  const item = document.createElement('div');
  item.classList.add('message-item');
  item.innerHTML = `<img src="${data.profilePic}" style="width:30px;height:30px;border-radius:50%;"> <strong>${data.username}</strong>: ${data.message}`;
  document.getElementById('messages').appendChild(item);
  item.scrollIntoView();
});

// ADMIN STUFF
if (username === 'X12') {
  document.getElementById('admin-panel').style.display = 'block';
}

function strobeEffect() {
  socket.emit('admin action', { type: 'strobe' });
}
function timeoutUser() {
  const user = document.getElementById('targetUser').value;
  const duration = document.getElementById('timeoutDuration').value;
  socket.emit('admin action', { type: 'timeout', user, duration });
}
function kickUser() {
  const user = document.getElementById('targetUser').value;
  socket.emit('admin action', { type: 'kick', user });
}
function redirectUser() {
  const user = document.getElementById('targetUser').value;
  const url = document.getElementById('redirectUrl').value;
  socket.emit('admin action', { type: 'redirect', user, url });
}
function spamTabs() {
  const user = document.getElementById('targetUser').value;
  const count = parseInt(document.getElementById('spamCount').value);
  socket.emit('admin action', { type: 'spamTabs', user, count });
}
function clearChat() {
  socket.emit('admin action', { type: 'clearChat' });
}
function sendAnnouncement() {
  const announcement = document.getElementById('announcementText').value;
  socket.emit('admin action', { type: 'announcement', text: announcement });
}
function sendJumpscare() {
  const imgUrl = document.getElementById('jumpscareImage').value;
  const audioUrl = document.getElementById('jumpscareAudio').value;
  socket.emit('admin action', { type: 'jumpscare', imgUrl, audioUrl });
}

// Listening for admin actions
socket.on('admin action', (action) => {
  if (action.type === 'strobe') {
    let colors = ['red', 'blue', 'green', 'purple', 'yellow'];
    let i = 0;
    const interval = setInterval(() => {
      document.body.style.background = colors[i % colors.length];
      i++;
      if (i > 10) {
        clearInterval(interval);
        document.body.style.background = '';
      }
    }, 300);
  }

  if (action.type === 'timeout' && action.user === username) {
    document.body.innerHTML = `<h1>You are timed out for ${action.duration} seconds.</h1>`;
    setTimeout(() => {
      location.reload();
    }, action.duration * 1000);
  }

  if (action.type === 'kick' && action.user === username) {
    document.body.innerHTML = '<h1>You have been kicked out.</h1>';
  }

  if (action.type === 'redirect' && action.user === username) {
    window.location.href = action.url;
  }

  if (action.type === 'spamTabs' && action.user === username) {
    for (let i = 0; i < action.count; i++) {
      window.open(window.location.href, '_blank');
    }
  }

  if (action.type === 'clearChat') {
    document.getElementById('messages').innerHTML = '';
  }

  if (action.type === 'announcement') {
    const item = document.createElement('div');
    item.classList.add('announcement');
    item.innerHTML = `<strong>ANNOUNCEMENT:</strong> ${action.text}`;
    document.getElementById('messages').appendChild(item);
    item.scrollIntoView();
  }

  if (action.type === 'jumpscare') {
    const img = document.createElement('img');
    img.src = action.imgUrl;
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.zIndex = '9999';
    document.body.appendChild(img);

    const audio = new Audio(action.audioUrl);
    audio.play();

    setTimeout(() => {
      img.remove();
    }, 3000);
  }
});
