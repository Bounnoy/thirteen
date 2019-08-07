// server.js

var express = require('express');
var socket = require('socket.io');
var axios = require('axios');
var server = express();

var p1deck = [];
var p2deck = [];
var p3deck = [];
var p4deck = [];
var p1move = [];
var p2move = [];
var p3move = [];
var p4move = [];
var lastMove = [];

var pile = [];
var turn = {
  'player': '',
  'pattern': ''
};

server.use('/client', express.static(__dirname + '/client'));

var io = socket(server.listen(process.env.PORT || "8000"));

server.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});





io.on('connection', function(client) {
  console.log('Client connected...');

  newDeck(client);

  // Continuously check for whose turn it is.
  setInterval(() => {
    if (turn.player === 'Player 2') {
      var cpuDeck = [];
      for (var i = 0; i < p2deck.length; i++) {
        cpuDeck.push(p2deck[i].code);
      }
      var toPlay = cpuAI(turn.pattern, cpuDeck, lastMove);

      if (toPlay.length === 0) console.log('Empty');
      else console.log(toPlay);

      pile.length = 0;
      p2move.length = 0;
      lastMove.length = 0;
      turn.pattern = patternCode(toPlay);
      turn.player = 'Player 3';
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < p2deck.length; j++) {
          if (toPlay[i] === p2deck[j].code) {
            pile.push(p2deck[j]);
            p2move.push(toPlay[i]);
            lastMove.push(toPlay[i]);
            p2deck.splice(j, 1);
          }
        }
      }
      console.log(p2deck.length);
      io.to(client.id).emit('pile', pile);
      io.to(client.id).emit('cpu', {
        'p2': p2deck.length,
        'p3': p3deck.length,
        'p4': p4deck.length,
        'p2move': p2move,
        'p3move': p3move,
        'p4move': p4move
      });
      io.to(client.id).emit('turn', {'turn': turn});
    }

    else if (turn.player === 'Player 3') {
      var cpuDeck = [];
      for (var i = 0; i < p3deck.length; i++) {
        cpuDeck.push(p3deck[i].code);
      }
      var toPlay = cpuAI(turn.pattern, cpuDeck, lastMove);

      console.log(toPlay);

      pile.length = 0;
      p3move.length = 0;
      lastMove.length = 0;
      turn.pattern = patternCode(toPlay);
      turn.player = 'Player 4';
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < p3deck.length; j++) {
          if (toPlay[i] === p3deck[j].code) {
            pile.push(p3deck[j]);
            p3move.push(toPlay[i]);
            lastMove.push(toPlay[i]);
            p3deck.splice(j, 1);
          }
        }
      }
      console.log(p3deck.length);
      io.to(client.id).emit('pile', pile);
      io.to(client.id).emit('cpu', {
        'p2': p2deck.length,
        'p3': p3deck.length,
        'p4': p4deck.length,
        'p2move': p2move,
        'p3move': p3move,
        'p4move': p4move
      });
      io.to(client.id).emit('turn', {'turn': turn});
    }

    else if (turn.player === 'Player 4') {
      var cpuDeck = [];
      for (var i = 0; i < p4deck.length; i++) {
        cpuDeck.push(p4deck[i].code);
      }
      var toPlay = cpuAI(turn.pattern, cpuDeck, lastMove);

      console.log(toPlay);

      pile.length = 0;
      p4move.length = 0;
      lastMove.length = 0;
      turn.pattern = patternCode(toPlay);
      turn.player = client.id;
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < p4deck.length; j++) {
          if (toPlay[i] === p4deck[j].code) {
            pile.push(p4deck[j]);
            p4move.push(toPlay[i]);
            lastMove.push(toPlay[i]);
            p4deck.splice(j, 1);
          }
        }
      }
      console.log(p4deck.length);
      io.to(client.id).emit('pile', pile);
      io.to(client.id).emit('cpu', {
        'p2': p2deck.length,
        'p3': p3deck.length,
        'p4': p4deck.length,
        'p2move': p2move,
        'p3move': p3move,
        'p4move': p4move
      });
      io.to(client.id).emit('turn', {'turn': turn});
    }
  }, 5000);

  client.on('play', function(toPlay) {

    // Check to make sure it's a player's turn.
    if (turn.player != client.id) return;

    var pat = patternCode(toPlay);

    // If no game yet, must play 3S
    console.log(toPlay[0]);
    if (turn.pattern === '' && toPlay[0] != '3S') {
      io.to(client.id).emit('badPattern', {
        'message': 'Must play 3 of Spades in your pattern.'
      });
      return;
    }

    // Check to make sure pattern is valid.
    if (pat === '0') {
      io.to(client.id).emit('badPattern', {
        'message': 'Wrong pattern. Try something else.'
      });
      return;
    }

    // Check to make sure player is following previous pattern.
    if (turn.pattern != '' && pat != turn.pattern) {
      io.to(client.id).emit('badPattern', {
        'message': 'Must use same pattern as previous player.'
      });
      return;
    }

    // Check if player is using a higher value pattern.
    if (compareCards(toPlay[toPlay.length - 1], lastMove[lastMove.length - 1]) === -1) {
      io.to(client.id).emit('badPattern', {
        'message': 'Your selected cards are lower than the current cards.'
      });
      return;
    }

    // Clear pile each time we play. May need to change later
    // if we implement game history.
    pile.length = 0;
    lastMove.length = 0;
    turn.pattern = pat;
    turn.player = 'Player 2';
    for (var i = 0; i < toPlay.length; i++) {
      for (var j = 0; j < p1deck.length; j++) {
        if (toPlay[i] === p1deck[j].code) {
          pile.push(p1deck[j]);
          p1move.push(toPlay[i]);
          lastMove.push(toPlay[i]);
          p1deck.splice(j, 1);
        }
      }
    }

    console.log(p1deck.length);
    io.to(client.id).emit('game', p1deck);
    io.to(client.id).emit('pile', pile);
    io.to(client.id).emit('turn', {'turn': turn});
  });

  client.on('skip', () => {
    turn.player = 'Player 2';
    p1move.length = 0;
    io.to(client.id).emit('game', p1deck);
    io.to(client.id).emit('turn', {'turn': turn});
  });

  client.on('disconnect', function() {
    p1deck.length = 0;
    p2deck.length = 0;
    p3deck.length = 0;
    p4deck.length = 0;
    p1move.length = 0;
    p2move.length = 0;
    p3move.length = 0;
    p4move.length = 0;
    lastMove.length = 0;
    pile.length = 0;
    turn = {
      'player': '',
      'pattern': ''
    };
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

    for (var i = 0; i < 13; i++) {
      if (p1deck[i].code === '3S') turn.player = client.id;
    }

    for (var i = 0; i < 13; i++) {
      if (p2deck[i].code === '3S') turn.player = 'Player 2';
    }

    for (var i = 0; i < 13; i++) {
      if (p3deck[i].code === '3S') turn.player = 'Player 3';
    }

    for (var i = 0; i < 13; i++) {
      if (p4deck[i].code === '3S') turn.player = 'Player 4';
    }

    console.log(turn.player);
    io.to(client.id).emit('game', p1deck);
    io.to(client.id).emit('pile', []);
    io.to(client.id).emit('cpu', {
      'p2': p2deck.length,
      'p3': p3deck.length,
      'p4': p4deck.length,
      'p2move': p2move,
      'p3move': p3move,
      'p4move': p4move
    });
    io.to(client.id).emit('turn', {'turn': turn});



    // var test = [];
    // for (var i = 0; i < p1deck.length; i++) {
    //   test.push(p1deck[i].code);
    // }
    // console.log(possibleMoves(test).length);
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
        if (pat[i][0] === pat[i + 1][0] &&
            pat[i + 1][0] === pat[i + 2][0] &&
            checkStraight(pat[i][0], pat[i + 3][0]) === 1) ++tsCount;
      }

      if (tsCount * 3 === n) return n.toString() + 'T';
    }

    // Double Straights
    var dsCount = 1;
    if (n >= 6 && n % 2 === 0) {

      for (var i = 0; i < (n - 2); i += 2) {
        if (pat[i][0] === pat[i + 1][0] &&
            checkStraight(pat[i][0], pat[i + 2][0]) === 1) ++dsCount;
      }

      if (dsCount * 2 === n) return n.toString() + 'D';
    }

    // N-Straight
    var sCount = 1;
    for (var i = 0; i < (n - 1); i++) {
      if (checkStraight(pat[i][0], pat[i + 1][0]) === 1) ++sCount;
    }

    if (sCount === n) {

      // Instant Win: 12 straight
      if (sCount === 12) return 'WS';

      return n.toString() + 'S';
    }
  }

  return '0';
};

// This function takes an array and returns all combinations to calculate
// the possible moves a player can make. Note that the array should be sorted
// for best efficiency. Otherwise, the time complexity will be a factorial of 13,
// which is over 6 billion possible permutations. This algorithm cuts it down to 8,191.
// This code was found on (and modified for this project):
// https://codereview.stackexchange.com/questions/7001/generating-all-combinations-of-an-array
var combinations = function(deck) {
  var fn = function(active, rest, a) {
    if (active.length === 0 && rest.length === 0) return;
    if (rest.length === 0) a.push(active);
    else {
      active.push(rest[0]);
      fn(active, rest.slice(1), a);
      fn(active, rest.slice(1), a);
    }
    return a;
  }

  return fn([], deck, []);
};

// This function returns a list of possible moves represented as a 2D array.
var possibleMoves = function(deck) {
  var moves = [];
  var variation = combinations(deck);
  console.log(variation.length);

  for (var i = 0; i < variation.length; i++) {
    if (patternCode(variation[i]) != '0') moves.push(variation[i]);
  }

  console.log(moves.length);

  return moves;
};

// Computer AI
// Pick a pattern, check CPU deck, check last move, and then return cards to play.
// We won't make the AI smart at all. It'll just pick an expected pattern of cards.
var cpuAI = function(patCode, cpuDeck, lastMove) {
  var n1 = cpuDeck.length;
  var n2 = lastMove.length;

  if (n1 > 0 && patCode === '') return [cpuDeck[0]]; // Must play 3S
  if (n1 > 0 && patCode === '0') {
    if (n1 >= 4) {
      // Play quads first.
      for (var i = 0; i < n1 - 3; i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            cpuDeck[i + 1][0] === cpuDeck[i + 2][0] &&
            cpuDeck[i + 2][0] === cpuDeck[i + 3][0]) {
          return cpuDeck.slice(i, i + 4);
        }
      }
    }

    if (n1 >= 3) {
      // Play triples first.
      for (var i = 0; i < n1 - 2; i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            cpuDeck[i + 1][0] === cpuDeck[i + 2][0]) {
          return cpuDeck.slice(i, i + 3);
        }
      }

      // Play straights.
      var sCount = 1;
      for (var i = 0; i < (n1 - 1); i++) {
        if (checkStraight(cpuDeck[i][0], cpuDeck[i + 1][0]) === 1) ++sCount;
        else {
          if (sCount >= 3) {
            return cpuDeck.slice(i - (sCount - 2), i + 2);
          }
          sCount = 1;
          j = n2; // this breaks the loop
        }
      }

      if (sCount > 3 ) return cpuDeck.slice(n1 - sCount, n1);
    }

    if (n1 >= 2) {
      // Play pairs first.
      for (var i = 0; i < n1; i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0]) {
          return cpuDeck.slice(i, i + 2);
        }
      }
    }

    // Play singles.
    return cpuDeck.slice(0, 1);
  } // Play anything.

  if (n1 >= n2 && patCode.endsWith('K')) {
    if (patCode[0] === '1') {
      for (var i = 0; i < cpuDeck.length; i++) {
        if (compareCards(cpuDeck[i], lastMove[0]) === 1) return [cpuDeck[i]];
      }
    }
    if (patCode[0] === '2') {
      for (var i = 0; i < (cpuDeck.length - 1); i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            compareCards(cpuDeck[i + 1], lastMove[1]) === 1)
          return cpuDeck.slice(i, i + 2);
      }
    }
    if (patCode[0] === '3') {
      for (var i = 0; i < (cpuDeck.length - 2); i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            cpuDeck[i + 1][0] === cpuDeck[i + 2][0] &&
            compareCards(cpuDeck[i + 2], lastMove[2]) === 1)
          return cpuDeck.slice(i, i + 3);
      }
    }
    if (patCode[0] === '4') {
      for (var i = 0; i < (cpuDeck.length - 3); i++) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            cpuDeck[i + 1][0] === cpuDeck[i + 2][0] &&
            cpuDeck[i + 2][0] === cpuDeck[i + 3][0] &&
            compareCards(cpuDeck[i + 3], lastMove[3]) === 1)
          return cpuDeck.slice(i, i + 4);
      }
    }

    return [];
  }

  if (n1 >= n2 && patCode.endsWith('S')) {
    var sCount = 1;
    for (var i = 0; i < (n2 - 1); i++) {
      if (compareCards(cpuDeck[i + n2 - 1], lastMove[n2 - 1]) === 1) {
        for (var j = 0; j < n2; j++) {
          if (checkStraight(cpuDeck[i][0], cpuDeck[i + 1][0]) === 1) ++sCount;
          else {
            sCount = 1;
            j = n2; // this breaks the loop
          }
        }

        if (sCount === n2) return cpuDeck.slice(i, i + n2);
      }
    }
    return [];
  }

  if (n1 >= n2 && patCode.endsWith('D')) {
    var dsCount = 1;
    if (n1 % 2 === 0) {

      for (var i = 0; i < (n2 - 2); i += 2) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            checkStraight(cpuDeck[i][0], cpuDeck[i + 2][0]) === 1) ++dsCount;
        else dsCount = 1;

        if (dsCount * 2 === n2 &&
            compareCards(cpuDeck[i + 3], lastMove[n2 - 1]) === 1) {
            return cpuDeck.slice(i - (n2 - 4), i + 4);
        }
      }
    }
    return [];
  }

  if (n1 >= n2 && patCode.endsWith('T')) {
    var tsCount = 1;
    if (n1 % 3 === 0) {

      for (var i = 0; i < (n2 - 3); i += 3) {
        if (cpuDeck[i][0] === cpuDeck[i + 1][0] &&
            cpuDeck[i + 1][0] === cpuDeck[i + 2][0] &&
            checkStraight(cpuDeck[i][0], cpuDeck[i + 3][0]) === 1) ++tsCount;
        else tsCount = 1;

        if (tsCount * 3 === n2 &&
            compareCards(cpuDeck[i + 5], lastMove[n2 - 1]) === 1) {
              return cpuDeck.slice(i - (n2 - 6), i + 6);
        }
      }
    }
    return [];
  }

  return [];
};
