// Make connection
var socket = io.connect("http://localhost:8080", {
    autoConnect: false
});

// Query DOM
var chatBox = document.getElementById('chat-box'),
    message = document.getElementById('message'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback'),
    appStatus = document.getElementById('app-status'),
    handleConnectionInput = document.getElementById('handleConnection-input'),
    handleConnectionPrompt = document.getElementById('handleConnection-prompt'),
    initPrompt = document.getElementById('init-prompt');

// setInterval
var currentInterval = false;
var checkInterval;
var timeout;

// Emit Event
handleConnectionInput.addEventListener("click", function(){
  handleConnection();
});

handleConnectionPrompt.addEventListener("click", function(){
  handleConnection();
});

btn.addEventListener("click", function(){
  submitInput();
});

// Listen for Events (from the server)
socket.on('chat', function(data){
  if(data._id === socket.id) {
    output.innerHTML += '<div class="flex-container--left"><p class="chat-window__output--current"><strong>' +
                        'You: </strong>' + data.message + '</p></div>';
  } else {
    output.innerHTML += '<div class="flex-container--right"><p class="chat-window__output--stranger"><strong>' +
                        'Stranger: </strong>' + data.message + '</p></div>';
  }
  output.scrollTop = output.scrollHeight;
  feedback.innerHTML = "";
});

socket.on('typing', function(data){
  if(data){
    feedback.innerHTML = '<p>Stranger is typing a message</p>';
  } else {
    feedback.innerHTML = "";
  }
});

socket.on('roomConnected', function(data){
  clearInterval(checkInterval);
  currentInterval = false;
  appStatus.innerHTML = '<p>Connected!</p>';
  message.disabled = false;
  socket.emit('setRoom');
});

socket.on('checkInterval', function(data){
  appStatus.innerHTML = '<p>Connecting...</p>';
  if(!currentInterval){
    currentInterval = true;
    checkInterval = setInterval(function(){
      socket.emit('findRoom');
    }, 3000);
  }
});

socket.on('disconnect', function(data){
  // First Call - Disconnect
  // Second Call - Append to UI
  if(data){
    output.innerHTML += '<p>Disconnected!</p>';
    appStatus.innerHTML = '';
    feedback.innerHTML = '';
    handleConnectionInput.innerText = "Connect";
    output.innerHTML += '<button class="init-prompt__button--append" id="handleConnection-prompt" onclick="handleConnection()">Start New Chat</button>';
  } else {
    socket.disconnect();
  }
});

message.addEventListener("keypress", function(e){
  socket.emit('typing', 'Stranger');
  clearTimeout(timeout);
  timeout = setTimeout(timeOut, 2000);

  if(socket.connected && e.keyCode == 13){
    e.preventDefault();
    submitInput();
  }
});

function timeOut() {
    socket.emit("typing", false);
};

function submitInput() {
  if(socket.connected && message.value.length > 0){
    socket.emit('chat', {
      message: message.value
    });
    message.value = "";
  }
};

function handleConnection(){
  if(!socket.connected){
    output.innerHTML = "";
    socket.connect();
    socket.emit('findRoom');
    // handle.disabled = true;
    handleConnectionInput.innerText = "Disconnect";
    initPrompt.style.display = "none";
  } else {
    socket.disconnect();
    if(currentInterval) {
      clearInterval(checkInterval);
      currentInterval = false;
    }
    handleConnection.innerText = "Connect";
    message.disabled = true;
  }
}
