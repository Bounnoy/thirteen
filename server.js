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

// Compares c1 with c2. Returns...
// -1 if c1 < c2
// 0 if c1 == c2
// 1 if c1 > c2
var compareCards = function(c1, c2) {
  var add = function (num) {
    var sum = 0;
    if (num === '3') sum += 30;
    if (num === '4') sum += 40;
    if (num === '5') sum += 50;
    if (num === '6') sum += 60;
    if (num === '7') sum += 70;
    if (num === '8') sum += 80;
    if (num === '9') sum += 90;
    if (num === '0') sum += 100;
    if (num === 'J') sum += 110;
    if (num === 'Q') sum += 120;
    if (num === 'K') sum += 130;
    if (num === 'A') sum += 140;
    if (num === '2') sum += 150;
    if (num === 'S') sum += 1;
    if (num === 'C') sum += 2;
    if (num === 'D') sum += 3;
    if (num === 'H') sum += 4;
    return sum;
  };

  var s1 = add(c1[0]) + add(c1[1]);
  var s2 = add(c2[0]) + add(c2[1]);
  if (s1 < s2) return -1;
  if (s1 > s2) return 1;
  return 0;
};

// This function takes in an unsorted array of objects and returns
// a sorted version of it.
var sortCards = function(unsorted) {

  for (var i = 0; i <= unsorted.length - 2; i++) {
    var min = i;

    for (var j = i + 1; j <= unsorted.length - 1; j++) {
      if (compareCards(unsorted[j].code, unsorted[min].code) === -1) min = j;
    }

    var temp = unsorted[i];
    unsorted[i] = unsorted[min];
    unsorted[min] = temp;
  }

  return unsorted;
};


// This function creates a new shuffled deck and sets the deck_id.
var newDeck = async (client) => {
  try {
    var shuffle = await axios.get(
      'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
    );

    var draw = await axios.get(
      `https://deckofcardsapi.com/api/deck/${shuffle.data.deck_id}/draw/?count=52`
    );

    var unsort1 = [];
    var unsort2 = [];
    var unsort3 = [];
    var unsort4 = [];

    for (var i = 0; i < 13; i++) {
      unsort1.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      unsort2.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      unsort3.push(draw.data.cards.pop());
    }

    for (var i = 0; i < 13; i++) {
      unsort4.push(draw.data.cards.pop());
    }

    p1deck = sortCards(unsort1);
    p2deck = sortCards(unsort2);
    p3deck = sortCards(unsort3);
    p4deck = sortCards(unsort4);

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
