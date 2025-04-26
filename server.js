const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files (your client side)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
let users = {};
let timeouts = {};

io.on('connection', socket => {
    console.log('A user connected');

    socket.on('register', (username, callback) => {
        if (Object.values(users).includes(username)) {
            callback({ success: false, message: 'Username taken' });
        } else {
            users[socket.id] = username;
            callback({ success: true });
            io.emit('userlist', users);
        }
    });

    socket.on('chatMessage', data => {
        io.emit('chatMessage', { username: users[socket.id], text: data });
    });

    socket.on('adminStrobe', () => {
        io.emit('strobe');
    });

    socket.on('adminAnnouncement', (message) => {
        io.emit('announcement', message);
    });

    socket.on('adminKick', (username) => {
        const socketId = Object.keys(users).find(id => users[id] === username);
        if (socketId) {
            io.to(socketId).emit('kicked');
            io.sockets.sockets.get(socketId).disconnect();
        }
    });

    socket.on('adminTimeout', (username, duration) => {
        const socketId = Object.keys(users).find(id => users[id] === username);
        if (socketId) {
            io.to(socketId).emit('timeout', duration);
            timeouts[socketId] = Date.now() + duration * 1000;
        }
    });

    socket.on('adminUpload', (imageUrl, audioUrl) => {
        io.emit('adminUpload', { imageUrl, audioUrl });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        delete users[socket.id];
        delete timeouts[socket.id];
        io.emit('userlist', users);
    });
});

// Start server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
