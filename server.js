const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = new Map(); // username -> socket.id
const userProfiles = new Map(); // username -> profilePic

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('claim-username', ({ username, profilePic }, callback) => {
        if (users.has(username)) {
            return callback({ success: false, message: 'Username already taken' });
        }

        users.set(username, socket.id);
        userProfiles.set(username, profilePic);
        socket.username = username;

        callback({ success: true });
        io.emit('user-joined', username);
    });

    socket.on('send-message', ({ message, profilePic }) => {
        if (socket.username) {
            io.emit('new-message', {
                username: socket.username,
                message,
                profilePic: profilePic || userProfiles.get(socket.username),
                image: null
            });
        }
    });

    socket.on('send-image', ({ imageUrl, profilePic }) => {
        if (socket.username) {
            io.emit('new-message', {
                username: socket.username,
                message: '',
                profilePic: profilePic || userProfiles.get(socket.username),
                image: imageUrl
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users.delete(socket.username);
            userProfiles.delete(socket.username);
            io.emit('user-left', socket.username);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
