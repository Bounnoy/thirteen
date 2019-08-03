// app.js

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {});
const port = process.env.PORT || "8000";

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/client/index.html');
})

app.use('/client', express.static(__dirname + '/client'));



server.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

io.sockets.on('connection', function (socket) {
  console.log('socket connection');
});
