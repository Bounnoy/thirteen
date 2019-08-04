// app.js

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{});
const port = process.env.PORT || "8000";

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/index.html');
})

app.use('/client', express.static(__dirname + '/client'));

io.on('connection', function (client) {
  console.log('Client connected...');

  client.on('join', function(data) {
    console.log(data);
    client.emit('messages', 'Hello from server');
  });
});

server.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
