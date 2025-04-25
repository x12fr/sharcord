const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; // username: socket.id

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('register', (username) => {
        users[socket.id] = username;
        socket.username = username;
        console.log(`${username} registered`);
    });

    socket.on('chat message', (data) => {
        console.log(`message from ${data.username}: ${data.message}`);
        io.emit('chat message', { username: data.username, message: data.message });
    });

    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} disconnected`);
        delete users[socket.id];
    });
});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
