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

// Spectator mode - no drag and drop functionality
function onDragStart() {
    return false;
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
    currentPlayer = game.turn();
    updateStatus();
});

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
        status = 'Game over';
        clearInterval(timerInterval);
    } else if (!gameHasStarted) {
        status = 'Waiting for players to join';
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
            color: 'spectator'
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
    draggable: false, // Disable dragging for spectators
    position: 'start',
    onDragStart: onDragStart,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/alpha/{piece}.png'
};

board = Chessboard('myBoard', config);
updateStatus();

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    socket.emit('spectateGame', {
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