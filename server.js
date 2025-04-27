const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Handle page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle socket events
io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('chat image', (data) => {
        io.emit('chat image', data);
    });

    socket.on('jumpscare', (data) => {
        io.emit('do jumpscare', data);
    });

    socket.on('kick', (usernameToKick) => {
        io.emit('kicked user', usernameToKick);
    });

    socket.on('force pfp', (data) => {
        io.emit('force pfp', data);
    });

    socket.on('strobe', () => {
        io.emit('strobe');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

// Custom kick handler (handle on client-side)
io.on('connection', (socket) => {
    socket.on('kicked user', (usernameToKick) => {
        socket.username = usernameToKick;
    });
});

http.listen(PORT, () => {
    console.log(`Sharcord server running on port ${PORT}`);
});
