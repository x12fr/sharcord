const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from public folder
app.use(express.static('public'));

// Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Data
const users = {};
const sockets = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('register', ({ username, password }) => {
        if (users[username]) {
            socket.emit('registerFailed', 'Username already taken.');
        } else {
            users[username] = { password };
            socket.emit('registerSuccess');
        }
    });

    socket.on('login', ({ username, password }) => {
        if (users[username] && users[username].password === password) {
            sockets[socket.id] = username;
            socket.emit('loginSuccess', { username });
        } else {
            socket.emit('loginFailed', 'Invalid credentials.');
        }
    });

    socket.on('sendMessage', (data) => {
        io.emit('chatMessage', data);
    });

    socket.on('adminFlash', ({ duration }) => {
        io.emit('flashScreen', { duration });
    });

    socket.on('adminAnnouncement', ({ message }) => {
        io.emit('announcement', { message });
    });

    socket.on('adminJumpScare', ({ imageUrl, audioUrl }) => {
        io.emit('jumpScare', { imageUrl, audioUrl });
    });

    socket.on('adminSpamTabs', ({ username, link, amount }) => {
        for (let id in sockets) {
            if (sockets[id] === username) {
                io.to(id).emit('spamTabs', { link, amount });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        delete sockets[socket.id];
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
