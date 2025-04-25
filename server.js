const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

const users = {}; // username -> { password, profilePic, timeoutUntil }

const ADMIN_USERNAME = 'X12';
const ADMIN_PASSWORD = '331256444';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Register endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Missing data');

    if (users[username]) {
        return res.status(400).send('Username already taken');
    }

    users[username] = {
        password: password,
        profilePic: '',
        timeoutUntil: null
    };
    return res.status(200).send('Registered');
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).send('Missing data');

    // Check admin login
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        if (!users[username]) {
            users[username] = {
                password: password,
                profilePic: '',
                timeoutUntil: null
            };
        }
        return res.status(200).json({ admin: true });
    }

    // Regular user login
    const user = users[username];
    if (!user || user.password !== password) {
        return res.status(400).send('Login failed');
    }

    return res.status(200).json({ admin: false });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // You can put your real-time features here (chat, admin features, etc)
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
