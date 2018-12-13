const express = require('express'),
      app = express(),
      socket = require('socket.io'),
      crypto = require("crypto");

// App setup
var server = app.listen(8080, function(){
  console.log("Running on port 8080!");
});

// Static files
app.use(express.static('public'));

// Socket setup
var io = socket(server);
var clientQueue = [];
// Connection from browser
// Each client is going to have its own socket between it and the server

io.of("/").on('connection', function(socket){
  var isChecking = false;
  var currentRoom;
  console.log("Connection successful!");
  clientQueue.push(socket);

  socket.on('findRoom', function(data){
    console.log("Running Find Room!");
    if(clientQueue.length > 1){
      console.log("Room joined!");
      let createRoom = crypto.randomBytes(20).toString('hex');

      socket.join(createRoom);
      clientQueue[0].join(createRoom);

      socket.emit('roomConnected');
      clientQueue[0].emit('roomConnected');

      clientQueue.shift();
      var i = clientQueue.indexOf(socket);
      if(i !== -1) clientQueue.splice(i, 1);

      isChecking = false;
    } else {
      if(!isChecking){
        isChecking = true;
        socket.emit('checkInterval');
      }
    }
  });

  socket.on('chat', function(data){
    io.in(currentRoom).emit('chat', {...data, _id: socket.id});
  });

  socket.on('typing', function(data){
    socket
      .to(currentRoom)
      .emit('typing', data);
  });

  socket.on('setRoom', function(data){
    currentRoom = Object.keys(socket.rooms)[1];
  });

  socket.on('disconnect', function(){
    var i = clientQueue.indexOf(socket);
    if(i !== -1) clientQueue.splice(i, 1);

    io.of('/').in(currentRoom).emit('disconnect');
  });
});
