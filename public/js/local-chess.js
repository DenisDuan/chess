var board, game = new Chess();

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function (source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
};

var onDrop = function (source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    sendMoveToOpponent(source, target);
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
var onSnapEnd = function () {
    board.position(game.fen());
};

// Chess board configuration
var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = ChessBoard('board', cfg);

// Send the move detail to the other player
var sendMoveToOpponent = function (source, target) {
    socket.emit('chessMove', {
        source: source,
        target: target
    });
};

// Listens to the 'chessMove' event from server 
socket.on('chessMove', function (req) {
    var source = req.source;
    var target = req.target;
    if (source && target) {
        board.move(source + '-' + target);
        game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
        board.position(game.fen(), false);
    }
});