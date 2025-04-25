const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const users = {}; // username => { password, profilePic }
const sessions = {}; // sessionId => username
const timeouts = {}; // username => timeoutEnd timestamp

const adminUsername = 'X12';
const adminPassword = '331256444';

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML files
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

// Handle Registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.status(400).send('Username already taken.');
    }
    users[username] = { password, profilePic: '' };
    res.redirect('/login');
});

// Handle Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        res.redirect('/chat');
    } else if (username === adminUsername && password === adminPassword) {
        res.redirect('/chat');
    } else {
        res.status(401).send('Invalid credentials.');
    }
});

// Socket.IO communication
io.on('connection', (socket) => {
    console.log('User connected.');

    socket.on('registerUser', (userData) => {
        socket.username = userData.username;
        socket.profilePic = userData.profilePic;
        io.emit('userJoined', { username: socket.username, profilePic: socket.profilePic });
    });

    socket.on('chatMessage', (data) => {
        if (timeouts[socket.username] && Date.now() < timeouts[socket.username]) {
            socket.emit('timeoutMessage', 'You are currently timed out.');
            return;
        }
        io.emit('chatMessage', { username: socket.username, message: data.message, profilePic: socket.profilePic });
    });

    socket.on('sendImage', (data) => {
        io.emit('sendImage', { username: socket.username, image: data.image, profilePic: socket.profilePic });
    });

    // Admin Features
    socket.on('adminStrobe', (data) => {
        if (socket.username === adminUsername) {
            io.emit('strobeScreen', data);
        }
    });

    socket.on('adminPlayAudio', (data) => {
        if (socket.username === adminUsername) {
            io.emit('playAudio', data);
        }
    });

    socket.on('adminTimeout', ({ targetUsername, duration }) => {
        if (socket.username === adminUsername) {
            const timeoutEnd = Date.now() + duration * 1000;
            timeouts[targetUsername] = timeoutEnd;
            io.emit('userTimeout', { username: targetUsername, duration });
        }
    });

    socket.on('adminRedirect', ({ targetUsername, link }) => {
        if (socket.username === adminUsername) {
            io.emit('redirectUser', { username: targetUsername, link });
        }
    });

    socket.on('adminJumpscare', (data) => {
        if (socket.username === adminUsername) {
            io.emit('adminJumpscare', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected.');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
