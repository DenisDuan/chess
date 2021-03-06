/**
 * Entry point of the socket chat app
 */
const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const moment = require('moment');

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

io.on('connection', (socket) => {

    // Sends the welcome message to the player when joined 
    socket.emit('message', {
        text: 'Welcome to the game!',
        name: 'System',
        timestamp: moment().valueOf()
    });

    // User just connected to the landing page
    socket.on('welcome', () => {
        // Tells the user the active game has user joined
        io.emit('activeRoom', {
            rooms: getActiveGame(clientInfo)
        });
    });

    // Action when user disconnect/left a chat room
    socket.on('disconnect', () => {
        let userData = clientInfo[socket.id];
        if (typeof userData !== 'undefined') {
            socket.leave(userData.room);
            io.to(userData.room).emit('message', {
                name: 'System',
                text: `${userData.name} has left.`,
                timestamp: moment().valueOf()
            });
            delete clientInfo[socket.id];
        }
    });

    // Listen to the event that a new user join a game, "req" object is 
    // in the format of {name, room}
    socket.on('joinRoom', (req) => {
        clientInfo[socket.id] = req;
        socket.join(req.room);
        socket.broadcast.to(req.room).emit('message', {
            name: 'System',
            text: `${req.name} has joined!`,
            timestamp: moment().valueOf()
        });
    });

    // Listen to the event when a new message incomming
    socket.on('message', (message) => {
        // add timestamp to the message
        message.timestamp = moment().valueOf();
        // "io.emit" will send the message to everybody including the sender
        io.to(clientInfo[socket.id].room).emit('message', message);

        // This will send the message to everyboy excludes the sender
        // socket.broadcast.emit('message', message);
    });

    // Relay the incomming chess move data to the other player
    socket.on('chessMove', (req) => {
        if (req.source && req.target) {
            socket.broadcast.to(clientInfo[socket.id].room).emit('chessMove', req);
        }
    });
});

/**
 * The function returns the game that has been created (has user joined) 
 */
function getActiveGame(clientArray) {
    let localArray = clientArray;
    let roomSet = new Set();
    Object.keys(localArray).forEach((socketId) => {
        var room = localArray[socketId].room;
        if (room) {
            roomSet.add(room);
        }
    });
    return Array.from(roomSet);
}

// Server listens to a port
http.listen(PORT, () => {
    console.log('Server started');
});