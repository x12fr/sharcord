const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let users = {}; // username -> { password, pfp, socketId }
let timeouts = {}; // username -> timeout end timestamp

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        res.redirect(`/chat?username=${username}`);
    } else {
        res.send('<script>alert("Invalid login!"); window.location.href="/login";</script>');
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        res.send('<script>alert("Username already taken!"); window.location.href="/register";</script>');
    } else {
        users[username] = { password, pfp: '/default.png', socketId: null };
        res.redirect(`/chat?username=${username}`);
    }
});

io.on('connection', (socket) => {
    socket.on('register-user', (username) => {
        if (users[username]) {
            users[username].socketId = socket.id;
            socket.username = username;
            io.emit('update-users', users);
        }
    });

    socket.on('chat-message', (msg) => {
        if (timeouts[socket.username] && Date.now() < timeouts[socket.username]) {
            socket.emit('error-message', 'You are timed out!');
            return;
        }
        io.emit('chat-message', { user: socket.username, pfp: users[socket.username].pfp, msg });
    });

    socket.on('image-message', (imgUrl) => {
        if (timeouts[socket.username] && Date.now() < timeouts[socket.username]) {
            socket.emit('error-message', 'You are timed out!');
            return;
        }
        io.emit('image-message', { user: socket.username, pfp: users[socket.username].pfp, imgUrl });
    });

    socket.on('change-pfp', (newPfp) => {
        if (users[socket.username]) {
            users[socket.username].pfp = newPfp;
            io.emit('update-users', users);
        }
    });

    socket.on('admin-change-pfp', ({ targetUser, newPfp }) => {
        if (socket.username === 'X12' && users[targetUser]) {
            users[targetUser].pfp = newPfp;
            io.emit('update-users', users);
        }
    });

    socket.on('timeout-user', ({ targetUser, seconds }) => {
        if (socket.username === 'X12' && users[targetUser]) {
            timeouts[targetUser] = Date.now() + seconds * 1000;
            io.emit('user-timeout', { targetUser, seconds });
        }
    });

    socket.on('redirect-user', ({ targetUser, url }) => {
        if (socket.username === 'X12' && users[targetUser]) {
            io.to(users[targetUser].socketId).emit('redirect', url);
        }
    });

    socket.on('kick-user', (targetUser) => {
        if (socket.username === 'X12' && users[targetUser]) {
            io.to(users[targetUser].socketId).emit('kicked');
            io.emit('user-kicked', targetUser);
        }
    });

    socket.on('strobe-user', (targetUser) => {
        if (socket.username === 'X12' && users[targetUser]) {
            io.to(users[targetUser].socketId).emit('strobe');
        }
    });

    socket.on('strobe-all', () => {
        if (socket.username === 'X12') {
            io.emit('strobe');
        }
    });

    socket.on('play-audio', (audioUrl) => {
        if (socket.username === 'X12') {
            io.emit('play-audio', audioUrl);
        }
    });

    socket.on('jumpscare', () => {
        if (socket.username === 'X12') {
            io.emit('jumpscare');
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users[socket.username].socketId = null;
        }
        io.emit('update-users', users);
    });
});

http.listen(3000, () => {
    console.log('Sharcord server running on port 3000');
});
