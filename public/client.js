// Simple front-end "fake" chat (no backend yet)

let users = {}; // { username: profilePicURL }
let currentUser = localStorage.getItem('username');
let profilePic = localStorage.getItem('profilePic');

// Redirect if not logged in
if (!currentUser && window.location.pathname.includes('chat.html')) {
    window.location.href = 'index.html';
}

// Handle claiming username
if (document.getElementById('claimButton')) {
    document.getElementById('claimButton').addEventListener('click', () => {
        const usernameInput = document.getElementById('usernameInput').value.trim();
        if (!usernameInput) return alert('Enter a username!');
        
        if (localStorage.getItem('allUsers')) {
            users = JSON.parse(localStorage.getItem('allUsers'));
            if (users[usernameInput]) {
                return alert('Username already taken!');
            }
        }

        users[usernameInput] = '';
        localStorage.setItem('allUsers', JSON.stringify(users));
        localStorage.setItem('username', usernameInput);
        localStorage.setItem('profilePic', '');

        window.location.href = 'chat.html';
    });
}

// Chat functions
if (window.location.pathname.includes('chat.html')) {
    const chatBox = document.getElementById('chatBox');
    const messageInput = document.getElementById('messageInput');
    const sendImageButton = document.getElementById('sendImageButton');
    const profilePicInput = document.getElementById('profilePicInput');

    function sendMessage(text, imageUrl = null) {
        const msgDiv = document.createElement('div');
        msgDiv.style.margin = "10px";
        
        const pic = profilePic || 'https://via.placeholder.com/30'; // Default pic
        msgDiv.innerHTML = `
            <img src="${pic}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;">
            <strong>${currentUser}</strong>: ${text}
            ${imageUrl ? `<br><img src="${imageUrl}" style="max-width:200px;margin-top:5px;">` : ''}
        `;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (messageInput.value.trim()) {
                sendMessage(messageInput.value.trim());
                messageInput.value = '';
            }
        }
    });

    sendImageButton.addEventListener('click', () => {
        const imageUrl = prompt('Enter Image URL:');
        if (imageUrl) {
            sendMessage('', imageUrl);
        }
    });

    profilePicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            profilePic = profilePicInput.value.trim();
            localStorage.setItem('profilePic', profilePic);
            alert('Profile picture updated!');
            profilePicInput.value = '';
        }
    });
}
