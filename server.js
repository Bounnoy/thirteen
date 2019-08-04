// server.js

var express = require('express');
var socket = require('socket.io');
var axios = require('axios');
var server = express();

var p1deck = [];
var p2deck = [];
var p3deck = [];
var p4deck = [];


server.use('/client', express.static(__dirname + '/client'));

var io = socket(server.listen(process.env.PORT || "8000"));

server.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});





io.on('connection', function(client) {
  console.log('Client connected...');

  // io.emit('messages', {
  //   'test': 'test'
  // });
  newDeck(client);

  client.on('disconnect', function() {
    p1deck.splice(0, p1deck.length);
    p2deck.splice(0, p2deck.length);
    p3deck.splice(0, p3deck.length);
    p4deck.splice(0, p4deck.length);
  })
});

// This function creates a new shuffled deck and sets the deck_id.
const newDeck = async (client) => {
  try {
    var shuffle = await axios.get(
      'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
    );

    var draw = await axios.get(
      `https://deckofcardsapi.com/api/deck/${shuffle.data.deck_id}/draw/?count=52`
    );

    for (var i = 0; i < 13; i++) {
      p1deck.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      p2deck.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      p3deck.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      p4deck.push(draw.data.cards.pop());
    }

    io.to(client.id).emit('game', p1deck);
    io.to(client.id).emit('cpu', {
      'p2': p2deck.length,
      'p3': p3deck.length,
      'p4': p4deck.length
    });

  } catch (error) {
    console.log(`Error: ${error.code}`);
  }
};

// This function takes a deck_id and deals cards to each player.
const newGame = async (deck, player) => {
};

// server.listen(port, () => {
//   console.log(`Listening to requests on http://localhost:${port}`);
// });
