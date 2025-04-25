const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const adminPanel = document.getElementById('admin-panel');

// Get username (this is super basic, can be improved)
let username = prompt('Enter your username:');
socket.emit('register', username);

// Show admin panel if username is admin
if (username === 'X12') {
    adminPanel.style.display = 'block';
} else {
    adminPanel.style.display = 'none';
}

// Send message
form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', {
            username: username,
            message: input.value
        });
        input.value = '';
    }
});

// Receive message
socket.on('chat message', function(data) {
    const item = document.createElement('li');
    item.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});
