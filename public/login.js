const socket = io();

document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault(); // stop the normal page reload

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert('Please fill out both fields.');
    return;
  }

  socket.emit('login', { username, password });
});

socket.on('loginSuccess', (data) => {
  sessionStorage.setItem('username', data.username);
  sessionStorage.setItem('profilePic', data.profilePic || 'default.png');
  window.location.href = '/chat.html';
});

socket.on('loginFail', (message) => {
  alert(message);
});
