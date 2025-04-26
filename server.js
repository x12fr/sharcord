const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let users = {}; // { username: { password, pfp, socketId } }
let messages = []; // [{ username, text, pfp }]

const adminUsername = "X12";
const adminPassword = "331256444";

// Serve pages
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

// Handle register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already taken');
    }
    users[username] = { password, pfp: 'default.png', socketId: null };
    res.redirect('/login');
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username].password === password) {
        return res.redirect('/chat?user=' + username);
    }
    res.send('Incorrect username or password');
});

// Socket.io connections
io.on('connection', socket => {
    console.log('A user connected');

    socket.on('join', username => {
        if (!users[username]) return;
        users[username].socketId = socket.id;
        socket.username = username;

        // Send old messages
        socket.emit('load messages', messages);

        // Announce join
        io.emit('message', { username: 'System', text: `${username} joined`, pfp: 'default.png' });
    });

    socket.on('chat message', (msg) => {
        if (!socket.username) return;
        const user = users[socket.username];
        const messageData = { username: socket.username, text: msg, pfp: user.pfp };
        messages.push(messageData);
        io.emit('message', messageData);
    });

    socket.on('send image', (imgUrl) => {
        if (!socket.username) return;
        const user = users[socket.username];
        io.emit('image', { username: socket.username, img: imgUrl, pfp: user.pfp });
    });

    socket.on('change pfp', (pfpUrl) => {
        if (!socket.username) return;
        users[socket.username].pfp = pfpUrl;
    });

    socket.on('timeout', (target, duration) => {
        if (socket.username !== adminUsername) return;
        const targetSocketId = users[target]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('timeout', duration);
        }
    });

    socket.on('redirect', (target, url) => {
        if (socket.username !== adminUsername) return;
        const targetSocketId = users[target]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('redirect', url);
        }
    });

    socket.on('announce', (text) => {
        if (socket.username !== adminUsername) return;
        io.emit('announcement', text);
    });

    socket.on('flash', () => {
        if (socket.username !== adminUsername) return;
        io.emit('flash');
    });

    socket.on('play audio', (url) => {
        if (socket.username !== adminUsername) return;
        io.emit('play audio', url);
    });

    socket.on('jumpscare', (target, imgUrl, audioUrl) => {
        if (socket.username !== adminUsername) return;
        const targetSocketId = users[target]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('jumpscare', { imgUrl, audioUrl });
        }
    });

    socket.on('spam tabs', (target, link, amount) => {
        if (socket.username !== adminUsername) return;
        const targetSocketId = users[target]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('spam tabs', { link, amount });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        if (socket.username) {
            io.emit('message', { username: 'System', text: `${socket.username} left`, pfp: 'default.png' });
            if (users[socket.username]) {
                users[socket.username].socketId = null;
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
