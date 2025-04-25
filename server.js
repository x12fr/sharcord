// ... previous code
let tempAdmins = {}; // { username: expiryTimestamp }

function isAdmin(username) {
    return username === 'X12' || (tempAdmins[username] && Date.now() < tempAdmins[username]);
}

io.on('connection', socket => {
    let currentUser = null;

    socket.on('login', username => {
        currentUser = username;
        socket.username = username;
        io.emit('announcement', `${username} joined.`);
    });

    socket.on('chat message', msg => {
        if (timeouts[currentUser] && timeouts[currentUser] > Date.now()) return;
        io.emit('chat message', { username: currentUser, message: msg });
    });

    socket.on('admin:strobe', () => {
        if (isAdmin(currentUser)) io.emit('strobe');
    });

    socket.on('admin:timeout', data => {
        if (isAdmin(currentUser)) timeouts[data.username] = Date.now() + data.duration * 1000;
    });

    socket.on('admin:kick', username => {
        if (isAdmin(currentUser)) {
            const sock = findSocketByUsername(username);
            if (sock) sock.disconnect(true);
        }
    });

    socket.on('admin:redirect', data => {
        if (isAdmin(currentUser)) {
            const sock = findSocketByUsername(data.username);
            if (sock) sock.emit('redirect', data.url);
        }
    });

    socket.on('admin:spamTabs', username => {
        if (isAdmin(currentUser)) {
            const sock = findSocketByUsername(username);
            if (sock) sock.emit('spamTabs');
        }
    });

    socket.on('admin:clearChat', () => {
        if (isAdmin(currentUser)) io.emit('clearChat');
    });

    socket.on('admin:jumpscare', data => {
        if (isAdmin(currentUser)) io.emit('jumpscare', data);
    });

    socket.on('admin:grantTempAdmin', data => {
        if (isAdmin(currentUser)) {
            tempAdmins[data.username] = Date.now() + data.duration * 1000;
            io.emit('announcement', `${data.username} was temporarily granted admin rights.`);
        }
    });

    socket.on('admin:announce', msg => {
        if (isAdmin(currentUser)) io.emit('announcement', msg);
    });

    function findSocketByUsername(username) {
        return [...io.sockets.sockets.values()].find(s => s.username === username);
    }
});
// ... rest of server