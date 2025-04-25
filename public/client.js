const socket = io();
const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('sendBtn');
const sendImageBtn = document.getElementById('sendImageBtn');
const msgInput = document.getElementById('msgInput');
const messages = document.getElementById('messages');
const audioPlayer = document.getElementById('audioPlayer');

let isAdmin = false;

loginBtn.onclick = () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const pic = document.getElementById('pic').value;

  socket.emit('login', { username, password, pic }, (res) => {
    if (res.success) {
      document.getElementById('login').style.display = 'none';
      document.getElementById('chat').style.display = 'block';
      if (res.isAdmin) {
        isAdmin = true;
        document.getElementById('adminPanel').style.display = 'block';
      }
    } else {
      alert(res.error);
    }
  });
};

sendBtn.onclick = () => {
  const msg = msgInput.value;
  if (msg) {
    socket.emit('sendMessage', msg);
    msgInput.value = '';
  }
};

msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

sendImageBtn.onclick = () => {
  const file = document.getElementById('imgUpload').files[0];
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('sendImage', reader.result);
  };
  reader.readAsDataURL(file);
};

socket.on('chatMessage', ({ username, pic, message }) => {
  messages.innerHTML += `<div><img class="profile" src="${pic}" /> <b>${username}</b>: ${message}</div>`;
});

socket.on('imageMessage', ({ username, pic, image }) => {
  messages.innerHTML += `<div><img class="profile" src="${pic}" /> <b>${username}</b>: <img src="${image}" width="100"/></div>`;
});

socket.on('strobeScreen', (duration) => {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
  let i = 0;
  const interval = setInterval(() => {
    document.body.style.background = colors[i % colors.length];
    i++;
    if (i > duration * 10) {
      clearInterval(interval);
      document.body.style.background = 'black';
    }
  }, 100);
});

socket.on('playAudio', (url) => {
  const id = url.split('v=')[1]?.split('&')[0];
  audioPlayer.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
});

socket.on('timeout', (duration) => {
  alert(`You are timed out for ${duration} seconds.`);
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

// Admin actions
function strobe() {
  const duration = parseInt(prompt('Strobe duration in seconds:'), 10);
  socket.emit('adminStrobe', duration);
}
function playAudio() {
  const url = document.getElementById('ytUrl').value;
  socket.emit('adminAudio', url);
}
function timeoutUser() {
  const user = document.getElementById('timeoutUser').value;
  const duration = parseInt(document.getElementById('timeoutDuration').value, 10);
  socket.emit('adminTimeout', { user, duration });
}
function redirectUser() {
  const user = document.getElementById('redirectUser').value;
  const url = document.getElementById('redirectURL').value;
  socket.emit('adminRedirect', { user, url });
}
