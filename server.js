// server.js

var express = require('express');
var socket = require('socket.io');
var axios = require('axios');
var server = express();

var p1deck = [];
var p2deck = [];
var p3deck = [];
var p4deck = [];
var pile = [];
var turn = {
  'player': '',
  'pattern': []
};

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

  client.on('play', function(toPlay) {

    // Clear pile each time we play. May need to change later
    // if we implement game history.
    pile.length = 0;
    console.log(patternCode(toPlay));
    for (var i = 0; i < toPlay.length; i++) {
      for (var j = 0; j < p1deck.length; j++) {
        if (toPlay[i] === p1deck[j].code) {
          pile.push(p1deck[j]);
          p1deck.splice(j, 1);
        }
      }
    }

    console.log(p1deck.length);
    io.to(client.id).emit('game', p1deck);
    io.to(client.id).emit('pile', pile);
  });

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

// This function takes in an unsorted array of objects and returns
// a sorted version of it.
var sortCardArray = function(unsorted) {

  for (var i = 0; i <= unsorted.length - 2; i++) {
    var min = i;

    for (var j = i + 1; j <= unsorted.length - 1; j++) {
      if (compareCards(unsorted[j], unsorted[min]) === -1) min = j;
    }

    var temp = unsorted[i];
    unsorted[i] = unsorted[min];
    unsorted[min] = temp;
  }

  return unsorted;
};

// Compares 2 characters: c1 with c2. Returns...
// 1 if they are in order.
// 0 if they are not part of a straight.
var checkStraight = function(c1, c2) {
  if (c1 === '3' && c2 === '4') return 1;
  if (c1 === '4' && c2 === '5') return 1;
  if (c1 === '5' && c2 === '6') return 1;
  if (c1 === '6' && c2 === '7') return 1;
  if (c1 === '7' && c2 === '8') return 1;
  if (c1 === '8' && c2 === '9') return 1;
  if (c1 === '9' && c2 === '0') return 1;
  if (c1 === '0' && c2 === 'J') return 1;
  if (c1 === 'J' && c2 === 'Q') return 1;
  if (c1 === 'Q' && c2 === 'K') return 1;
  if (c1 === 'K' && c2 === 'A') return 1;

  return 0;
};

// This function creates a new shuffled deck and sets the deck_id.
// It also deals 13 cards to each player and sorts it for them.
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
    io.to(client.id).emit('pile', []);
    io.to(client.id).emit('cpu', {
      'p2': p2deck.length,
      'p3': p3deck.length,
      'p4': p4deck.length
    });

  } catch (error) {
    console.log(`Error: ${error.code}`);
  }
};

// This function checks an array for a pattern and returns a string that represents the pattern code.
// The following are valid pattern codes:
// 1K (singles)
// 2K (pairs)
// 3K (3 of a kind)
// 4K (4 of a kind)
// _S (straights)
// _D (double straights)
// _T (triple straights)
// W4 (four 2's - instant win)
// W2 (six pairs - instant win)
// WS (12 straight - instant win)
// B2 (pair of 2 - pattern breaker)
var patternCode = function(pat) {
  pat = sortCardArray(pat);
  var n = pat.length;
  console.log(pat);
  console.log('Length: ' + n);

  // Instant Win: 6 pairs
  if (n === 12) {
    var win = 0;
    for (var i = 0; i < (n - 1); i += 2) {
      if (pat[i][0] === pat[i + 1][0]) ++win;
    }

    if (win === 6) return 'W2';
  }

  // Singles
  if (n === 1) return '1K';

  // Pairs
  if (n === 2) {
    if (pat[0][0] === pat[1][0]) {

      // Pattern Breaker: Pair of 2's
      if (pat[0][0] === '2') return 'B2';
            
      return '2K';
    }
  }

  if (n >= 3) {

    // 3 of a Kind
    if (n === 3 && pat[0][0] === pat[1][0] && pat[1][0] === pat[2][0]) return '3K';

    // 4 of a Kind
    if (n === 4 &&
        pat[0][0] === pat[1][0] &&
        pat[1][0] === pat[2][0] &&
        pat[2][0] === pat[3][0]) {

        if (pat[0][0] === '2') return 'WK';
        return '4K';
    }

    // Triple Straights
    var tsCount = 1;
    if (n >= 9 && n % 3 === 0) {

      for (var i = 0; i < (n - 3); i += 3) {
        if (pat[i][0] === pat[i + 2][0] &&
            checkStraight(pat[i][0], pat[i + 3][0]) === 1) ++tsCount;
      }

      console.log('tsCount: ' + tsCount);
      console.log('n: ' + n);
      if (tsCount * 3 === n) return n.toString() + 'T';
    }

    // Double Straights
    var dsCount = 1;
    if (n >= 6 && n % 2 === 0) {

      for (var i = 0; i < (n - 2); i += 2) {
        if (pat[i][0] === pat[i + 1][0] &&
            checkStraight(pat[i][0], pat[i + 2][0]) === 1) ++dsCount;
      }

      console.log('dsCount: ' + dsCount);
      console.log('n: ' + n);
      if (dsCount * 2 === n) return n.toString() + 'D';
    }

    // N-Straight
    var sCount = 1;
    for (var i = 0; i < (n - 1); i++) {
      if (checkStraight(pat[i][0], pat[i + 1][0]) === 1) ++sCount;
    }

    console.log('sCount: ' + sCount);
    console.log('n: ' + n);
    if (sCount === n) {

      // Instant Win: 12 straight
      if (sCount === 12) return 'WS';

      return n.toString() + 'S';
    }
  }

  return '0';
};
