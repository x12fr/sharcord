let currentUser = null;
let servers = {};  // All servers
let currentServer = null;
let currentChannel = null;
let messages = {};  // Messages per channel

// Login Function
function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  // Simple auth (should be server-side later!)
  if (!localStorage.getItem(username)) {
    alert('User not found. Please register.');
    return;
  }

  const userData = JSON.parse(localStorage.getItem(username));
  if (userData.password !== password) {
    alert('Incorrect password.');
    return;
  }

  currentUser = username;
  localStorage.setItem('loggedInUser', username);
  window.location.href = 'chat.html';
}

// Register Function
function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  if (localStorage.getItem(username)) {
    alert('Username already exists.');
    return;
  }

  const userData = {
    username,
    password,
    friends: [],
    blocked: [],
    servers: []
  };

  localStorage.setItem(username, JSON.stringify(userData));
  alert('Registered successfully. You can now log in.');
}
