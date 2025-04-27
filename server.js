const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Sessions
app.use(session({
    secret: 'sharcord-secret-key', // (you can change this)
    resave: false,
    saveUninitialized: true
}));

// Load users
let users = [];
const USERS_FILE = path.join(__dirname, 'users.json');

if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
} else {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

// Routes
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
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'chat.html'));
    } else {
        res.redirect('/login');
    }
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = user; // Save user into session
        res.redirect('/chat');
    } else {
        res.send('Login failed. <a href="/login">Try again</a>');
    }
});

// Handle register
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const userExists = users.some(u => u.username === username);

    if (userExists) {
        res.send('Username already taken. <a href="/register">Try again</a>');
    } else {
        const newUser = { username, password };
        users.push(newUser);

        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.redirect('/login');
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Socket.io
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
