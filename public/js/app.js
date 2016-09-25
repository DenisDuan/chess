 var socket = io();

 // Trigger the 'connet' event that informs the server that user connected
 socket.on('connect', function () {
     socket.emit('welcome', {});
 });

 // listent to the rooms object
 socket.on('activeRoom', function (res) {
     var rooms = res.rooms;
     var roomsElem = $('.rooms');
     var roomOptionElem = $('.roomOption');
     if (typeof rooms !== 'undefined' && rooms.length > 0) {
         roomOptionElem.empty();
         rooms.forEach(function (roomName) {
             // Adds existing room to the page
             roomOptionElem.append('<div class="radio"><label><input type="radio" name="optionsRadios" value="'
                 + roomName + '">' + roomName + '</label></div>');
         });
         // Add event handler if radio btn is checked
         $(":radio").change(function(){
             $('input[name=room]').val(this.value);
         });
         roomsElem.show();
     }
 });