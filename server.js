const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = 'admin123'; // Your admin key

let chatHistory = []; // Saved chat messages

app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected.');

    let userData = {};

    socket.on('join', (data) => {
        const isAdmin = data.adminKey === ADMIN_KEY;
        userData = {
            username: data.username,
            pfp: data.pfp,
            isAdmin: isAdmin
        };

        socket.emit('init', { isAdmin });

        // Send chat history to the new user
        chatHistory.forEach(msg => {
            if (msg.type === 'text') {
                socket.emit('chat message', msg.data);
            } else if (msg.type === 'image') {
                socket.emit('chat image', msg.data);
            }
        });
    });

    socket.on('chat message', (msg) => {
        const messageData = {
            username: userData.username,
            message: msg,
            pfp: userData.pfp,
            isAdmin: userData.isAdmin
        };

        io.emit('chat message', messageData);
        chatHistory.push({ type: 'text', data: messageData });
    });

    socket.on('chat image', (imageUrl) => {
        const imageData = {
            username: userData.username,
            imageUrl: imageUrl,
            pfp: userData.pfp,
            isAdmin: userData.isAdmin
        };

        io.emit('chat image', imageData);
        chatHistory.push({ type: 'image', data: imageData });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
