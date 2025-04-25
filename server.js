const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const registeredUsers = {
  "X12": { password: "331256444", profilePic: "" } // Admin account
};

// Routes
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

// Register
app.post('/register', upload.single('profilePic'), (req, res) => {
  const { username, password } = req.body;
  if (registeredUsers[username]) {
    return res.status(400).send('Username already taken.');
  }

  const profilePic = req.file ? '/uploads/' + req.file.filename : '';
  registeredUsers[username] = { password, profilePic };
  res.send(`
    <script>
      alert("Registration successful!");
      window.location.href = "/login";
    </script>
  `);
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers[username];

  if (!user || user.password !== password) {
    return res.status(400).send('Invalid username or password.');
  }

  res.send(`
    <script>
      sessionStorage.setItem("username", "${username}");
      window.location.href = "/chat";
    </script>
  `);
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('admin action', (action) => {
    io.emit('admin action', action);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sharcord server running on port ${PORT}`);
});
