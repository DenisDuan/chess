
 (function () {

     var socket = io();
     var name = getQueryVariable('name') || 'Anonymous';
     var room = getQueryVariable('room') || 'Room';

     //-------- Chat Related function ----------------
      
     // Set up the room name
     $('h1.room-title').text(room);

     // Listen to the system 'connet' event that informs the server that user connected
     socket.on('connect', function () {
         socket.emit('joinRoom', {
             name: name,
             room: room
         });
     });

     // Listens to the 'message' event from server 
     socket.on('message', function (message) {
         // Get the timestamp in utc
         var momentTimestamp = moment.utc(message.timestamp);
         var messagesElem = $('.messages');
         var messageElem = $('<li class="list-group-item"></li>')

         // Adds the new incoming message to the page
         messageElem.append('<p><strong>' + message.name + ' ' +
             momentTimestamp.local().format('h:mm:ss a') + ': </strong></p>');
         messageElem.append('<p>' + message.text + '</p>');
         messagesElem.append(messageElem);

         // Move the scrollable panel to the bottom to show latest message
         var scrollablePanel = $('.pre-scrollable');
         scrollablePanel.scrollTop(scrollablePanel[0].scrollHeight);
     })

     //Handles submitting new message
     var form = $('#message-form');
     form.on('submit', function (event) {
         event.preventDefault();
         var inputElemObj = form.find('input[name=message]');
         socket.emit('message', {
             name: name,
             text: inputElemObj.val()
         });

         // Clean up the text field after commit
         inputElemObj.val('');
     });

    //-------- Chess Related function ---------------- 

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

 })();