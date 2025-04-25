const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

// Temporary in-memory user database
let users = {}; // { username: password }
let onlineUsers = {}; // { socket.id: username }

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve pages
app.get('/', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

// Handle registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already exists. Go back and try again.');
    }
    users[username] = password;
    console.log(`Registered new user: ${username}`);
    res.redirect('/');
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        return res.redirect(`/chat?username=${username}`);
    }
    res.send('Invalid username or password. Go back and try again.');
});

// SOCKET.IO
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (username) => {
        onlineUsers[socket.id] = username;
        socket.username = username;
        io.emit('chat message', { username: 'Sharcord', message: `${username} joined the chat.` });
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { username: data.username, message: data.message });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('chat message', { username: 'Sharcord', message: `${socket.username} left the chat.` });
            delete onlineUsers[socket.id];
        }
    });
});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
