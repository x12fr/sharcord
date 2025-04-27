const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

let users = {}; // username: { socketId, profilePic }

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

let registeredUsers = {}; // username: password

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (registeredUsers[username] && registeredUsers[username] === password) {
        res.redirect(`/chat.html?username=${username}`);
    } else {
        res.send("Invalid credentials. <a href='/login'>Try again</a>");
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (registeredUsers[username]) {
        res.send("Username already taken. <a href='/register'>Try again</a>");
    } else {
        registeredUsers[username] = password;
        res.redirect(`/chat.html?username=${username}`);
    }
});

io.on('connection', (socket) => {
    let currentUser = "";

    socket.on('setUsername', (username) => {
        currentUser = username;
        users[username] = { socketId: socket.id, profilePic: "https://via.placeholder.com/30" };
    });

    socket.on('chatMessage', (msg) => {
        if (users[currentUser]) {
            io.emit('chatMessage', {
                username: currentUser,
                message: msg,
                profilePic: users[currentUser].profilePic
            });
        }
    });

    socket.on('chatImage', (image) => {
        if (users[currentUser]) {
            io.emit('chatImage', {
                username: currentUser,
                image: image,
                profilePic: users[currentUser].profilePic
            });
        }
    });

    socket.on('setProfilePic', (url) => {
        if (users[currentUser]) {
            users[currentUser].profilePic = url;
            socket.emit('updatePFP', url);
        }
    });

    // ADMIN CONTROLS
    socket.on('adminStrobe', () => {
        if (currentUser === "X12") {
            io.emit('strobe');
        }
    });

    socket.on('adminAudio', (url) => {
        if (currentUser === "X12") {
            io.emit('playAudio', url);
        }
    });

    socket.on('adminTimeout', ({ user, duration }) => {
        if (currentUser === "X12" && users[user]) {
            io.to(users[user].socketId).emit('timeout', duration);
        }
    });

    socket.on('adminRedirect', ({ user, link }) => {
        if (currentUser === "X12" && users[user]) {
            io.to(users[user].socketId).emit('redirect', link);
        }
    });

    socket.on('adminChangePFP', ({ user, url }) => {
        if (currentUser === "X12" && users[user]) {
            users[user].profilePic = url;
            io.to(users[user].socketId).emit('updatePFP', url);
        }
    });

    socket.on('adminJumpScare', ({ img, audio }) => {
        if (currentUser === "X12") {
            io.emit('jumpScare', { img, audio });
        }
    });

    // ✅ NEW! Admin stop audio
    socket.on('adminStopAudio', () => {
        if (currentUser === "X12") {
            io.emit('stopAudio');
        }
    });

    socket.on('disconnect', () => {
        if (currentUser) {
            delete users[currentUser];
        }
    });
});

http.listen(3000, () => {
    console.log('Sharcord Server listening on *:3000');
});
