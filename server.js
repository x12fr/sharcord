const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = {}; // username -> { password, pfp }
const sockets = {}; // socket.id -> username
let announcements = [];
let redirects = {};

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the html pages properly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/register.html'));
});
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/chat.html'));
});
app.get('/secret', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/secret.html'));
});

// Handle registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already exists!');
    }
    users[username] = { password, pfp: 'default.png' };
    res.redirect('/login');
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.send('Invalid login!');
    }
    res.redirect(`/chat?username=${username}`);
});

// Socket.io stuff
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('login', (username) => {
        sockets[socket.id] = username;
        socket.username = username;
        io.emit('userlist', Object.values(sockets));
    });

    socket.on('chat message', (msg) => {
        const username = sockets[socket.id];
        const pfp = users[username]?.pfp || 'default.png';
        io.emit('chat message', { username, pfp, msg });
    });

    socket.on('change pfp', (newpfp) => {
        const username = sockets[socket.id];
        if (users[username]) {
            users[username].pfp = newpfp;
        }
    });

    socket.on('announcement', (text) => {
        announcements.push(text);
        io.emit('announcement', text);
        setTimeout(() => {
            io.emit('clear announcement');
        }, 10000);
    });

    socket.on('redirect user', (targetUser) => {
        for (let id in sockets) {
            if (sockets[id] === targetUser) {
                io.to(id).emit('redirect secret');
                setTimeout(() => {
                    io.to(id).emit('redirect back');
                }, 5000);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        delete sockets[socket.id];
        io.emit('userlist', Object.values(sockets));
    });
});

// Start server
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
