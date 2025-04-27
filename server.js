const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Fake simple database (you can make this better later)
let users = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.redirect('/chat');
    } else {
        res.send('Login failed. <a href="/login">Try again</a>');
    }
});

// Handle register
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if username is taken
    const userExists = users.some(u => u.username === username);

    if (userExists) {
        res.send('Username already taken. <a href="/register">Try again</a>');
    } else {
        users.push({ username, password });
        res.redirect('/login');
    }
});

// Socket.io stuff
io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('chat image', (data) => {
        io.emit('chat image', data);
    });

    socket.on('jumpscare', (data) => {
        io.emit('do jumpscare', data);
    });

    socket.on('kick', (usernameToKick) => {
        io.emit('kicked user', usernameToKick);
    });

    socket.on('force pfp', (data) => {
        io.emit('force pfp', data);
    });

    socket.on('strobe', () => {
        io.emit('strobe');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

http.listen(PORT, () => {
    console.log(`Sharcord server running on port ${PORT}`);
});
