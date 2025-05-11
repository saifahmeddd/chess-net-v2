let gameHasStarted = false;
var board = null;
var game = new Chess();
var $status = $('#status');
var $moveHistory = $('#moveHistory');
var $chatMessages = $('#chatMessages');
var $chatInput = $('#chatInput');
let gameOver = false;

// Timer variables
let whiteTime = 600; // 10 minutes in seconds
let blackTime = 600;
let timerInterval;
let currentPlayer = 'w';

// Initialize timers
function updateTimer() {
    if (currentPlayer === 'w') {
        blackTime--;
        $('#blackTimer').text(formatTime(blackTime));
    } else {
        whiteTime--;
        $('#whiteTimer').text(formatTime(whiteTime));
    }

    if (whiteTime <= 0 || blackTime <= 0) {
        clearInterval(timerInterval);
        gameOver = true;
        updateStatus();
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (!gameHasStarted) return false;
    if (gameOver) return false;

    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || 
        (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        return false;
    }

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || 
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    let theMove = {
        from: source,
        to: target,
        promotion: 'q'
    };

    var move = game.move(theMove);

    if (move === null) return 'snapback';

    // Update move history
    updateMoveHistory();
    
    // Switch timer - update current player after the move
    currentPlayer = game.turn();

    socket.emit('move', theMove);
    updateStatus();
}

function updateMoveHistory() {
    const history = game.history();
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = history[i];
        const blackMove = history[i + 1] || '';
        html += `<div>${moveNumber}. ${whiteMove} ${blackMove}</div>`;
    }
    $moveHistory.html(html);
    $moveHistory.scrollTop($moveHistory[0].scrollHeight);
}

socket.on('newMove', function(move) {
    game.move(move);
    board.position(game.fen());
    updateMoveHistory();
    // Update current player after opponent's move
    currentPlayer = game.turn();
    updateStatus();
});

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    var status = '';
    var moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
        clearInterval(timerInterval);
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
        clearInterval(timerInterval);
    } else if (gameOver) {
        status = 'Opponent disconnected, you win!';
        clearInterval(timerInterval);
    } else if (!gameHasStarted) {
        status = 'Waiting for opponent to join';
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $status.html(status);
}

// Chat functionality
$('#sendMessage').on('click', function() {
    const message = $chatInput.val().trim();
    if (message) {
        socket.emit('chatMessage', {
            message: message,
            color: playerColor
        });
        $chatInput.val('');
    }
});

$chatInput.on('keypress', function(e) {
    if (e.which === 13) {
        $('#sendMessage').click();
    }
});

socket.on('chatMessage', function(data) {
    const messageClass = data.color.toLowerCase();
    const messageHtml = `<div class="chat-message ${messageClass}">[${data.color.toUpperCase()}] ${data.message}</div>`;
    $chatMessages.append(messageHtml);
    $chatMessages.scrollTop($chatMessages[0].scrollHeight);
});

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/alpha/{piece}.png'
};

board = Chessboard('myBoard', config);
if (playerColor === 'black') {
    board.flip();
}

updateStatus();

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    socket.emit('joinGame', {
        code: urlParams.get('code')
    });
}

socket.on('startGame', function() {
    gameHasStarted = true;
    startTimer();
    updateStatus();
});

socket.on('gameOverDisconnect', function() {
    gameOver = true;
    clearInterval(timerInterval);
    updateStatus();
}); 