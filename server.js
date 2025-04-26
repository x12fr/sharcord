const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');

const users = {}; // Store users { username: { password, profilePic, timeoutUntil } }

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
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

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already taken.');
    }
    users[username] = { password, profilePic: '/default.png', timeoutUntil: 0 };
    res.redirect('/login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.send('Invalid username or password.');
    }
    res.redirect(`/chat?username=${username}`);
});

io.on('connection', (socket) => {
    socket.on('join', ({ username, profilePic }) => {
        socket.username = username;
        socket.profilePic = profilePic;
        io.emit('user joined', { username, profilePic });
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', { username: socket.username, message: data.message, profilePic: socket.profilePic });
    });

    socket.on('image upload', (data) => {
        io.emit('image upload', { username: socket.username, image: data.image, profilePic: socket.profilePic });
    });

    socket.on('disconnect', () => {
        io.emit('user left', socket.username);
    });

    // Admin features
    socket.on('strobe', (data) => {
        io.emit('strobe', data);
    });

    socket.on('play audio', (url) => {
        io.emit('play audio', url);
    });

    socket.on('timeout user', ({ username, duration }) => {
        io.emit('timeout user', { username, duration });
    });

    socket.on('redirect user', ({ username, url }) => {
        io.emit('redirect user', { username, url });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
