const socket = io();

// Get username from URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user') || 'Guest';

// DOM elements
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

// Check if user is admin
socket.emit('check admin', { username }, (data) => {
  if (data.isAdmin) {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.style.display = 'block';
  }
});

// Send chat messages
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', { user: username, message: input.value });
    input.value = '';
  }
});

// Receive chat messages
socket.on('chat message', (data) => {
  const item = document.createElement('li');
  item.innerHTML = `<strong>${data.user}</strong>: ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Admin actions
socket.on('announcement', (msg) => {
  alert(`Announcement: ${msg}`);
});

socket.on('flash', () => {
  document.body.style.backgroundColor = 'red';
  setTimeout(() => {
    document.body.style.backgroundColor = '';
  }, 3000);
});

socket.on('jumpscare', () => {
  alert('👻 Boo!');
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

socket.on('timeout', (seconds) => {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.fontSize = '48px';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.innerText = `Timed out for ${seconds} seconds`;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, seconds * 1000);
});

socket.on('kick', () => {
  alert('You have been kicked.');
  window.location.href = '/';
});
