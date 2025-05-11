module.exports = io => {
    io.on('connection', socket => {
        console.log('New socket connection');

        let currentCode = null;

        socket.on('move', function(move) {
            console.log('move detected');
            io.to(currentCode).emit('newMove', move);
        });
        
        socket.on('joinGame', function(data) {
            currentCode = data.code;
            socket.join(currentCode);
            if (!games[currentCode]) {
                games[currentCode] = true;
                return;
            }
            
            io.to(currentCode).emit('startGame');
        });

        socket.on('spectateGame', function(data) {
            currentCode = data.code;
            socket.join(currentCode);
            
            // If game exists, send current game state
            if (games[currentCode]) {
                socket.emit('startGame');
            }
        });

        socket.on('chatMessage', function(data) {
            if (currentCode) {
                io.to(currentCode).emit('chatMessage', data);
            }
        });

        socket.on('disconnect', function() {
            console.log('socket disconnected');

            if (currentCode) {
                // Only emit game over if it's a player disconnecting, not a spectator
                if (socket.playerType === 'player') {
                    io.to(currentCode).emit('gameOverDisconnect');
                    delete games[currentCode];
                }
            }
        });
    });
}; 