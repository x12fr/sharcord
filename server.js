const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let users = {}; // username: socket.id
let admins = ['X12']; // Add usernames that are admins
let owner = 'X12'; // Only X12 is owner

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('register', ({ username, password }) => {
        if (Object.values(users).includes(username)) {
            socket.emit('registerError', 'Username taken.');
        } else {
            users[socket.id] = { username, password, socket };
            socket.emit('registerSuccess');
            io.emit('updateUserList', Object.values(users).map(u => u.username));
        }
    });

    socket.on('login', ({ username, password }) => {
        const user = Object.values(users).find(u => u.username === username && u.password === password);
        if (user) {
            users[socket.id] = { username, password, socket };
            socket.emit('loginSuccess', username);
            io.emit('updateUserList', Object.values(users).map(u => u.username));
        } else {
            socket.emit('loginError', 'Invalid login.');
        }
    });

    socket.on('sendMessage', ({ message, to }) => {
        if (to) {
            // Private DM
            const target = Object.values(users).find(u => u.username === to);
            if (target) {
                target.socket.emit('receiveMessage', { message, from: users[socket.id].username, private: true });
            }
        } else {
            // Public Chat
            io.emit('receiveMessage', { message, from: users[socket.id].username });
        }
    });

    socket.on('adminFlash', (targetUser) => {
        const target = Object.values(users).find(u => u.username === targetUser);
        if (target) {
            target.socket.emit('flashScreen');
        }
    });

    socket.on('adminAnnounce', (announcement) => {
        io.emit('receiveAnnouncement', announcement);
    });

    socket.on('adminRedirect', ({ targetUser, url }) => {
        const target = Object.values(users).find(u => u.username === targetUser);
        if (target) {
            target.socket.emit('redirect', url);
        }
    });

    socket.on('adminKick', (targetUser) => {
        const target = Object.values(users).find(u => u.username === targetUser);
        if (target) {
            target.socket.disconnect();
        }
    });

    socket.on('ownerJumpscare', () => {
        io.emit('jumpscare');
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users).map(u => u.username));
    });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
