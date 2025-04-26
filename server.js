const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

let users = {}; // username -> { password, pfp }
let sessions = {}; // sessionID -> username
let timeouts = {}; // username -> timeout timestamp
let admins = ["X12"]; // usernames who are admins

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already taken.');
    }
    users[username] = { password, pfp: '/default.png' };
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.send('Invalid login.');
    }
    const sessionID = Math.random().toString(36).substring(2);
    sessions[sessionID] = username;
    res.redirect(`/chat?session=${sessionID}`);
});

io.on('connection', (socket) => {
    socket.on('join', (sessionID) => {
        const username = sessions[sessionID];
        if (!username) {
            socket.emit('forceLogout');
            return;
        }
        socket.username = username;
        socket.pfp = users[username].pfp;
        socket.isAdmin = admins.includes(username);
        socket.emit('init', { username, pfp: socket.pfp, isAdmin: socket.isAdmin });
        io.emit('announcement', `${username} joined the chat.`);
    });

    socket.on('sendMessage', (msg) => {
        if (timeouts[socket.username] && timeouts[socket.username] > Date.now()) {
            socket.emit('timeoutMessage', 'You are timed out.');
            return;
        }
        io.emit('message', { username: socket.username, pfp: socket.pfp, text: msg });
    });

    socket.on('updatePfp', (newPfp) => {
        if (users[socket.username]) {
            users[socket.username].pfp = newPfp;
            socket.pfp = newPfp;
        }
    });

    socket.on('disconnect', () => {
        io.emit('announcement', `${socket.username} left the chat.`);
    });
});

http.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
