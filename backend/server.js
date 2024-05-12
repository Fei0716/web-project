const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const randomName = require('random-name'); // Import random-name library

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080",
    },
});

const users = {}; // Store connected users

io.on('connection', (socket) => {
    console.log('A user connected');

    // Generate a random name for the user
    const username = randomName.first(); // Generate random first name

    // Store the user's socket connection and username
    users[socket.id] = { socket: socket, username: username };

    // Emit the generated username back to the client
    socket.emit('authenticated', username);

    // Emit the list of connected users to all clients
    io.emit('usersList', Object.values(users).map(user => user.username));
    // Handle private messages
    socket.on('privateMessage', ({ recipient, message }) => {
        const recipientSocket = Object.values(users).find(user => user.username === recipient)?.socket; // Get the recipient's socket connection
        if (recipientSocket) {
            recipientSocket.emit('privateMessage', { sender: username, message : message });
        } else {
            console.log(`Recipient ${recipient} is not connected`);
            socket.emit('errorMessage', `Recipient ${recipient} is not connected`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User ${username} disconnected`);
        delete users[socket.id]; // Remove the user's socket connection from the list of connected users
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running at port ' + PORT);
});
