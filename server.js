// server.js

var express = require('express');
var socket = require('socket.io');
var axios = require('axios');
var server = express();
server.use('/client', express.static(__dirname + '/client'));

var io = socket(server.listen(process.env.PORT || "8000"));

server.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

var game = {};

io.on('connection', function(client) {
  console.log('Client connected: ' + client.id);
  game[client.id] = {
    p1deck: [],
    p2deck: [],
    p3deck: [],
    p4deck: [],
    p1move: [],
    p2move: [],
    p3move: [],
    p4move: [],
    p1skip: 0,
    p2skip: 0,
    p3skip: 0,
    p4skip: 0,
    lastMove: [],
    pile: [],
    turn: {
      'player': '',
      'pattern': ''
    },
    winner: '',
    winCode: 0,
    winMessage: ''
  };

  console.log('Current game instances: ' + (Object.entries(game).length === 0 && game.constructor === Object ? 0 : Object.entries(game).length));

  newDeck(client);

  // Check instant win after creating deck.
  game[client.id].winCode = checkInstantWin(game[client.id].p1deck);

  if (game[client.id].winCode > 0) game[client.id].winner = client.id;
  else game[client.id].winCode = checkInstantWin(game[client.id].p2deck);

  if (game[client.id].winner === '' && game[client.id].winCode > 0) game[client.id].winner = 'Player 2';
  else game[client.id].winCode = checkInstantWin(game[client.id].p3deck);

  if (game[client.id].winner === '' && game[client.id].winCode > 0) game[client.id].winner = 'Player 3';
  else game[client.id].winCode = checkInstantWin(game[client.id].p4deck);

  if (game[client.id].winner === '' && game[client.id].winCode > 0) game[client.id].winner = 'Player 4';

  if (game[client.id].winCode === 4) game[client.id].winMessage = ` four 2's!`;
  if (game[client.id].winCode === 6) game[client.id].winMessage = ` six pairs!`;
  if (game[client.id].winCode === 12) game[client.id].winMessage = ` a 12-straight!`;

  if (game[client.id].winner != '') {
    clearInterval(gameTimer);
    io.to(client.id).emit('cpu', {
      'p2': (game[client.id].winner === 'Player 2') ? 13 - game[client.id].winCode : 13,
      'p3': (game[client.id].winner === 'Player 3') ? 13 - game[client.id].winCode : 13,
      'p4': (game[client.id].winner === 'Player 4') ? 13 - game[client.id].winCode : 13,
      'p2move': [],
      'p3move': [],
      'p4move': []
    });
    io.to(client.id).emit('game', game[client.id].p1deck);
    io.to(client.id).emit('win', {
      'message': (game[client.id].winner === client.id) ?
        'Instant win! You have' + game[client.id].winMessage : 'Instant win! ' + game[client.id].winner + ' has' + game[client.id].winMessage
    });
    client.disconnect();
  }

  game[client.id].timer = gameTimer(client, io);

  // // Continuously check for whose turn it is.
  // var gameTimer = setInterval((client, io) => {
  //   if (game[client.id].winner != '') {
  //     console.log('Game timer stopped.');
  //     clearInterval(gameTimer);
  //     client.disconnect();
  //   }
  //
  //   if (game[client.id].turn.player === 'Player 2') {
  //     console.log('Turn: Player 2');
  //     if (game[client.id].p1skip + game[client.id].p3skip + game[client.id].p4skip > 2) {
  //       game[client.id].turn.pattern = '0';
  //       game[client.id].lastMove.length = 0;
  //       game[client.id].p1skip = 0;
  //       game[client.id].p2skip = 0;
  //       game[client.id].p3skip = 0;
  //       game[client.id].p4skip = 0;
  //     }
  //
  //     var cpuDeck = [];
  //     for (var i = 0; i < game[client.id].p2deck.length; i++) {
  //       cpuDeck.push(game[client.id].p2deck[i].code);
  //     }
  //     var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);
  //
  //     if (toPlay.length === 0) {
  //       console.log('Skip: Player 2');
  //       game[client.id].turn.player = 'Player 3';
  //       game[client.id].p2move.length = 0;
  //       io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //       io.to(client.id).emit('cpu', {
  //         'p2': game[client.id].p2deck.length,
  //         'p3': game[client.id].p3deck.length,
  //         'p4': game[client.id].p4deck.length,
  //         'p3move': game[client.id].p3move,
  //         'p4move': game[client.id].p4move
  //       });
  //       game[client.id].p2skip = 1;
  //       return;
  //     }
  //     else {
  //       game[client.id].p2skip = 0;
  //       console.log('Playing: ' + toPlay);
  //     }
  //
  //     game[client.id].pile.length = 0;
  //     game[client.id].p2move.length = 0;
  //     game[client.id].lastMove.length = 0;
  //     game[client.id].turn.pattern = patternCode(toPlay);
  //     game[client.id].turn.player = 'Player 3';
  //     for (var i = 0; i < toPlay.length; i++) {
  //       for (var j = 0; j < game[client.id].p2deck.length; j++) {
  //         if (toPlay[i] === game[client.id].p2deck[j].code) {
  //           game[client.id].pile.push(game[client.id].p2deck[j]);
  //           game[client.id].p2move.push(toPlay[i]);
  //           game[client.id].lastMove.push(toPlay[i]);
  //           game[client.id].p2deck.splice(j, 1);
  //         }
  //       }
  //     }
  //     console.log('Cards Left: ' + game[client.id].p2deck.length);
  //     console.log('Emitting to: ' + client.id);
  //     // Winner
  //     if (game[client.id].p2deck.length === 0) {
  //       console.log('Winner: Player 2');
  //       clearInterval(gameTimer);
  //       io.to(client.id).emit('win', {
  //         'message': 'Player 2 wins!'
  //       });
  //       client.disconnect();
  //       return;
  //     }
  //
  //     io.to(client.id).emit('pile', game[client.id].pile);
  //     io.to(client.id).emit('cpu', {
  //       'p2': game[client.id].p2deck.length,
  //       'p3': game[client.id].p3deck.length,
  //       'p4': game[client.id].p4deck.length,
  //       'p2move': game[client.id].p2move,
  //       'p3move': game[client.id].p3move,
  //       'p4move': game[client.id].p4move
  //     });
  //     io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //   }
  //
  //   else if (game[client.id].turn.player === 'Player 3') {
  //     console.log('Turn: Player 3');
  //     if (game[client.id].p1skip + game[client.id].p2skip + game[client.id].p4skip > 2) {
  //       game[client.id].turn.pattern = '0';
  //       game[client.id].lastMove.length = 0;
  //       game[client.id].p1skip = 0;
  //       game[client.id].p2skip = 0;
  //       game[client.id].p3skip = 0;
  //       game[client.id].p4skip = 0;
  //     }
  //
  //     var cpuDeck = [];
  //     for (var i = 0; i < game[client.id].p3deck.length; i++) {
  //       cpuDeck.push(game[client.id].p3deck[i].code);
  //     }
  //     var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);
  //
  //     if (toPlay.length === 0) {
  //       console.log('Skip: Player 3');
  //       game[client.id].turn.player = 'Player 4';
  //       game[client.id].p3move.length = 0;
  //       io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //       io.to(client.id).emit('cpu', {
  //         'p2': game[client.id].p2deck.length,
  //         'p3': game[client.id].p3deck.length,
  //         'p4': game[client.id].p4deck.length,
  //         'p2move': game[client.id].p2move,
  //         'p4move': game[client.id].p4move
  //       });
  //       game[client.id].p3skip = 1;
  //       return;
  //     }
  //     else {
  //       game[client.id].p3skip = 0;
  //       console.log('Playing: ' + toPlay);
  //     }
  //
  //     game[client.id].pile.length = 0;
  //     game[client.id].p3move.length = 0;
  //     game[client.id].lastMove.length = 0;
  //     game[client.id].turn.pattern = patternCode(toPlay);
  //     game[client.id].turn.player = 'Player 4';
  //     for (var i = 0; i < toPlay.length; i++) {
  //       for (var j = 0; j < game[client.id].p3deck.length; j++) {
  //         if (toPlay[i] === game[client.id].p3deck[j].code) {
  //           game[client.id].pile.push(game[client.id].p3deck[j]);
  //           game[client.id].p3move.push(toPlay[i]);
  //           game[client.id].lastMove.push(toPlay[i]);
  //           game[client.id].p3deck.splice(j, 1);
  //         }
  //       }
  //     }
  //     console.log('Cards Left: ' + game[client.id].p3deck.length);
  //     console.log('Emitting to: ' + client.id);
  //     // Winner
  //     if (game[client.id].p3deck.length === 0) {
  //       console.log('Winner: Player 3');
  //       clearInterval(gameTimer);
  //       io.to(client.id).emit('win', {
  //         'message': 'Player 3 wins!'
  //       });
  //       client.disconnect();
  //       return;
  //     }
  //
  //     io.to(client.id).emit('pile', game[client.id].pile);
  //     io.to(client.id).emit('cpu', {
  //       'p2': game[client.id].p2deck.length,
  //       'p3': game[client.id].p3deck.length,
  //       'p4': game[client.id].p4deck.length,
  //       'p2move': game[client.id].p2move,
  //       'p3move': game[client.id].p3move,
  //       'p4move': game[client.id].p4move
  //     });
  //     io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //   }
  //
  //   else if (game[client.id].turn.player === 'Player 4') {
  //     console.log('Turn: Player 4');
  //     if (game[client.id].p1skip + game[client.id].p2skip + game[client.id].p3skip > 2) {
  //       game[client.id].turn.pattern = '0';
  //       game[client.id].lastMove.length = 0;
  //       game[client.id].p1skip = 0;
  //       game[client.id].p2skip = 0;
  //       game[client.id].p3skip = 0;
  //       game[client.id].p4skip = 0;
  //     }
  //
  //     var cpuDeck = [];
  //     for (var i = 0; i < game[client.id].p4deck.length; i++) {
  //       cpuDeck.push(game[client.id].p4deck[i].code);
  //     }
  //     var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);
  //
  //     if (toPlay.length === 0) {
  //       console.log('Skip: Player 4');
  //       game[client.id].turn.player = client.id;
  //       game[client.id].p4move.length = 0;
  //       game[client.id].p4skip = 1;
  //
  //       // Should probably extract this part later and refactor
  //       // this entire section since a lot of the code is repeated.
  //       if (game[client.id].p2skip + game[client.id].p3skip + game[client.id].p4skip > 2) {
  //         game[client.id].turn.pattern = '0';
  //         game[client.id].lastMove.length = 0;
  //         game[client.id].p1skip = 0;
  //         game[client.id].p2skip = 0;
  //         game[client.id].p3skip = 0;
  //         game[client.id].p4skip = 0;
  //       }
  //       //
  //
  //       io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //       io.to(client.id).emit('cpu', {
  //         'p2': game[client.id].p2deck.length,
  //         'p3': game[client.id].p3deck.length,
  //         'p4': game[client.id].p4deck.length,
  //         'p2move': game[client.id].p2move,
  //         'p3move': game[client.id].p3move
  //       });
  //       return;
  //     }
  //     else {
  //       game[client.id].p4skip = 0;
  //       console.log('Playing: ' + toPlay);
  //     }
  //
  //     game[client.id].pile.length = 0;
  //     game[client.id].p4move.length = 0;
  //     game[client.id].lastMove.length = 0;
  //     game[client.id].turn.pattern = patternCode(toPlay);
  //     game[client.id].turn.player = client.id;
  //     for (var i = 0; i < toPlay.length; i++) {
  //       for (var j = 0; j < game[client.id].p4deck.length; j++) {
  //         if (toPlay[i] === game[client.id].p4deck[j].code) {
  //           game[client.id].pile.push(game[client.id].p4deck[j]);
  //           game[client.id].p4move.push(toPlay[i]);
  //           game[client.id].lastMove.push(toPlay[i]);
  //           game[client.id].p4deck.splice(j, 1);
  //         }
  //       }
  //     }
  //     console.log('Cards Left: ' + game[client.id].p4deck.length);
  //     console.log('Emitting to: ' + client.id);
  //     // Winner
  //     if (game[client.id].p4deck.length === 0) {
  //       console.log('Winner: Player 4');
  //       clearInterval(gameTimer);
  //       io.to(client.id).emit('win', {
  //         'message': 'Player 4 wins!'
  //       });
  //       client.disconnect();
  //       return;
  //     }
  //     io.to(client.id).emit('pile', game[client.id].pile);
  //     io.to(client.id).emit('cpu', {
  //       'p2': game[client.id].p2deck.length,
  //       'p3': game[client.id].p3deck.length,
  //       'p4': game[client.id].p4deck.length,
  //       'p2move': game[client.id].p2move,
  //       'p3move': game[client.id].p3move,
  //       'p4move': game[client.id].p4move
  //     });
  //     io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  //   }
  // }, 1000);

  client.on('newGame', () => {
    console.log('New Game Button: ' + client.id);
    game[client.id].p1deck.length = 0;
    game[client.id].p2deck.length = 0;
    game[client.id].p3deck.length = 0;
    game[client.id].p4deck.length = 0;
    game[client.id].p1move.length = 0;
    game[client.id].p2move.length = 0;
    game[client.id].p3move.length = 0;
    game[client.id].p4move.length = 0;
    game[client.id].p1skip = 0;
    game[client.id].p2skip = 0;
    game[client.id].p3skip = 0;
    game[client.id].p4skip = 0;
    game[client.id].lastMove.length = 0;
    game[client.id].pile.length = 0;
    game[client.id].turn = {
      'player': '',
      'pattern': ''
    };
    newDeck(client);
  });

  client.on('play', function(toPlay) {

    console.log('Play Button: ' + client.id);
    console.log('Turn: ' + game[client.id].turn.player);
    // Check to make sure it's a player's turn.
    if (game[client.id].turn.player != client.id) return;

    var pat = patternCode(toPlay);

    // If no game yet, must play 3S
    console.log('Playing: ' + toPlay);
    console.log('Pattern Code: ' + pat);
    if (game[client.id].turn.pattern === '' && toPlay[0] != '3S') {
      console.log('Bad Pattern: Must play 3 of Spades.');
      io.to(client.id).emit('badPattern', {
        'message': 'Must play 3 of Spades in your pattern.'
      });
      return;
    }

    // Check to make sure pattern is valid.
    if (pat === '0') {
      console.log('Bad Pattern: Wrong pattern. Try something else.');
      io.to(client.id).emit('badPattern', {
        'message': 'Wrong pattern. Try something else.'
      });
      return;
    }

    // Check to see if player can play a new pattern.
    if (game[client.id].turn.pattern === '0') game[client.id].turn.pattern = pat;

    // Check to make sure player is following previous pattern.
    if (game[client.id].turn.pattern != '') {
      if (game[client.id].turn.pattern === '2K' && pat === 'B2') {} // Do nothing.
      else if (game[client.id].turn.pattern === 'B2' && pat === '2K') {} // Do nothing.
      else if (pat != game[client.id].turn.pattern) {
        console.log('Bad Pattern: Must use same pattern as previous player.');
        io.to(client.id).emit('badPattern', {
          'message': 'Must use same pattern as previous player.'
        });
        return;
      }
    }

    // Check if player is using a higher value pattern.
    if (game[client.id].lastMove.length > 0 &&
        compareCards(toPlay[toPlay.length - 1], game[client.id].lastMove[game[client.id].lastMove.length - 1]) === -1) {
      console.log('Bad Pattern: Your selected cards are lower than the current cards.');
      io.to(client.id).emit('badPattern', {
        'message': 'Your selected cards are lower than the current cards.'
      });
      return;
    }

    // Clear pile each time we play. May need to change later
    // if we implement game history.
    game[client.id].pile.length = 0;
    game[client.id].lastMove.length = 0;
    game[client.id].p1skip = 0;
    game[client.id].turn.pattern = pat;
    game[client.id].turn.player = 'Player 2';
    for (var i = 0; i < toPlay.length; i++) {
      for (var j = 0; j < game[client.id].p1deck.length; j++) {
        if (toPlay[i] === game[client.id].p1deck[j].code) {
          game[client.id].pile.push(game[client.id].p1deck[j]);
          game[client.id].p1move.push(toPlay[i]);
          game[client.id].lastMove.push(toPlay[i]);
          game[client.id].p1deck.splice(j, 1);
        }
      }
    }

    console.log('Cards Left: ' + game[client.id].p1deck.length);
    // Winner
    if (game[client.id].p1deck.length === 0) {
      console.log('Winner: ' + client.id);
      clearInterval(gameTimer);
      io.to(client.id).emit('game', game[client.id].p1deck);
      io.to(client.id).emit('pile', game[client.id].pile);
      io.to(client.id).emit('win', {
        'message': 'You win!'
      });
      client.disconnect();
      return;
    }

    io.to(client.id).emit('game', game[client.id].p1deck);
    io.to(client.id).emit('pile', game[client.id].pile);
    io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  });

  client.on('skip', () => {
    console.log('Skip Button: ' + client.id);
    if (game[client.id].turn.pattern === '' || game[client.id].turn.pattern === '0') {
      io.to(client.id).emit('badPattern', {
        'message': 'Cannot skip your own turn.'
      });
      return;
    }

    game[client.id].turn.player = 'Player 2';
    game[client.id].p1skip = 1;
    game[client.id].p1move.length = 0;
    io.to(client.id).emit('game', game[client.id].p1deck);
    io.to(client.id).emit('turn', {'turn': game[client.id].turn});
  });

  client.on('disconnect', function() {
    console.log('Disconnected: ' + client.id);
    //clearInterval(game[client.id].timer);
    delete game[client.id];
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

// This function takes in an unsorted array of cards and returns
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

    game[client.id].p1deck = sortCards(unsort1);
    game[client.id].p2deck = sortCards(unsort2);
    game[client.id].p3deck = sortCards(unsort3);
    game[client.id].p4deck = sortCards(unsort4);

    for (var i = 0; i < 13; i++) {
      if (game[client.id].p1deck[i].code === '3S')
        game[client.id].turn.player = client.id;
    }

    for (var i = 0; i < 13; i++) {
      if (game[client.id].p2deck[i].code === '3S')
        game[client.id].turn.player = 'Player 2';
    }

    for (var i = 0; i < 13; i++) {
      if (game[client.id].p3deck[i].code === '3S')
        game[client.id].turn.player = 'Player 3';
    }

    for (var i = 0; i < 13; i++) {
      if (game[client.id].p4deck[i].code === '3S')
        game[client.id].turn.player = 'Player 4';
    }

    console.log('Turn: ' + game[client.id].turn.player);
    io.to(client.id).emit('game', game[client.id].p1deck);
    io.to(client.id).emit('pile', []);
    io.to(client.id).emit('cpu', {
      'p2': game[client.id].p2deck.length,
      'p3': game[client.id].p3deck.length,
      'p4': game[client.id].p4deck.length,
      'p2move': game[client.id].p2move,
      'p3move': game[client.id].p3move,
      'p4move': game[client.id].p4move
    });
    io.to(client.id).emit('turn', {'turn': game[client.id].turn});

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
// B2 (pair of 2 - pattern breaker)
var patternCode = function(pat) {
  pat = sortCardArray(pat);
  var n = pat.length;

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

    if (sCount === n) return n.toString() + 'S';
  }

  return '0';
};

// This function checks an array of cards for instant win patterns.
// Returns:
// 4 if four 2's.
// 6 if six pairs.
// 12 if 12 straights.
var checkInstantWin = function(cardObjects) {
  var cards = [];
  var n = cardObjects.length;

  for (var i = 0; i < n; i++) {
    cards.push(cardObjects.pop());
  }

  cards = sortCardArray(cards);

  // Instant Win: 6 pairs
  var win = 0;
  for (var i = 0; i < n; i++) {
    if ((i + 1) < n && cards[i][0] === cards[i + 1][0]) {
      ++win;
      ++i;
    }
  }
  if (win === 6) return 6;


  // Instant Win: Four 2's
  win = 0;
  for (var i = 0; i < n; i++) {
    if (cards[i][0] == 2) ++win;
  }
  if (win === 4) return 4;


  // Instant Win: 12 Straights
  win = 0;
  for (var i = 0; i < (n - 1); i++) {
    if (checkStraight(cards[i][0], cards[i + 1][0]) === 1) ++win;
  }
  if (win === 12) return 12;

  return 0; // This is reached when no match has been made.
}

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
            return cpuDeck.slice(i - (sCount - 1), i + 1);
          }
          sCount = 1;
          j = n2; // this breaks the loop
        }
      }

      if (sCount > 3 ) return cpuDeck.slice(n1 - sCount, n1);
    }

    if (n1 >= 2) {
      // Play pairs first.
      for (var i = 0; i < n1 - 1; i++) {
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
    for (var i = 0; i < (n1 - n2); i++) {//(n2 - 1); i++) {
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

// Continuously check for whose turn it is.
var gameTimer = (client, io) => {
  var innerTimer = setInterval(() => {

    // Self check.
    if (game.hasOwnProperty(client.id) === false) {
      clearInterval(innerTimer);
      return;
    }

    if (game[client.id].winner != '') {
      console.log('Game timer stopped.');
      clearInterval(gameTimer);
      client.disconnect();
    }

    if (game[client.id].turn.player === 'Player 2') {
      console.log('Turn: Player 2');
      if (game[client.id].p1skip + game[client.id].p3skip + game[client.id].p4skip > 2) {
        game[client.id].turn.pattern = '0';
        game[client.id].lastMove.length = 0;
        game[client.id].p1skip = 0;
        game[client.id].p2skip = 0;
        game[client.id].p3skip = 0;
        game[client.id].p4skip = 0;
      }

      var cpuDeck = [];
      for (var i = 0; i < game[client.id].p2deck.length; i++) {
        cpuDeck.push(game[client.id].p2deck[i].code);
      }
      var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);

      if (toPlay.length === 0) {
        console.log('Skip: Player 2');
        game[client.id].turn.player = 'Player 3';
        game[client.id].p2move.length = 0;
        io.to(client.id).emit('turn', {'turn': game[client.id].turn});
        io.to(client.id).emit('cpu', {
          'p2': game[client.id].p2deck.length,
          'p3': game[client.id].p3deck.length,
          'p4': game[client.id].p4deck.length,
          'p3move': game[client.id].p3move,
          'p4move': game[client.id].p4move
        });
        game[client.id].p2skip = 1;
        return;
      }
      else {
        game[client.id].p2skip = 0;
        console.log('Playing: ' + toPlay);
      }

      game[client.id].pile.length = 0;
      game[client.id].p2move.length = 0;
      game[client.id].lastMove.length = 0;
      game[client.id].turn.pattern = patternCode(toPlay);
      game[client.id].turn.player = 'Player 3';
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < game[client.id].p2deck.length; j++) {
          if (toPlay[i] === game[client.id].p2deck[j].code) {
            game[client.id].pile.push(game[client.id].p2deck[j]);
            game[client.id].p2move.push(toPlay[i]);
            game[client.id].lastMove.push(toPlay[i]);
            game[client.id].p2deck.splice(j, 1);
          }
        }
      }
      console.log('Cards Left: ' + game[client.id].p2deck.length);
      console.log('Emitting to: ' + client.id);
      // Winner
      if (game[client.id].p2deck.length === 0) {
        console.log('Winner: Player 2');
        clearInterval(gameTimer);
        io.to(client.id).emit('win', {
          'message': 'Player 2 wins!'
        });
        client.disconnect();
        return;
      }

      io.to(client.id).emit('pile', game[client.id].pile);
      io.to(client.id).emit('cpu', {
        'p2': game[client.id].p2deck.length,
        'p3': game[client.id].p3deck.length,
        'p4': game[client.id].p4deck.length,
        'p2move': game[client.id].p2move,
        'p3move': game[client.id].p3move,
        'p4move': game[client.id].p4move
      });
      io.to(client.id).emit('turn', {'turn': game[client.id].turn});
    }

    else if (game[client.id].turn.player === 'Player 3') {
      console.log('Turn: Player 3');
      if (game[client.id].p1skip + game[client.id].p2skip + game[client.id].p4skip > 2) {
        game[client.id].turn.pattern = '0';
        game[client.id].lastMove.length = 0;
        game[client.id].p1skip = 0;
        game[client.id].p2skip = 0;
        game[client.id].p3skip = 0;
        game[client.id].p4skip = 0;
      }

      var cpuDeck = [];
      for (var i = 0; i < game[client.id].p3deck.length; i++) {
        cpuDeck.push(game[client.id].p3deck[i].code);
      }
      var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);

      if (toPlay.length === 0) {
        console.log('Skip: Player 3');
        game[client.id].turn.player = 'Player 4';
        game[client.id].p3move.length = 0;
        io.to(client.id).emit('turn', {'turn': game[client.id].turn});
        io.to(client.id).emit('cpu', {
          'p2': game[client.id].p2deck.length,
          'p3': game[client.id].p3deck.length,
          'p4': game[client.id].p4deck.length,
          'p2move': game[client.id].p2move,
          'p4move': game[client.id].p4move
        });
        game[client.id].p3skip = 1;
        return;
      }
      else {
        game[client.id].p3skip = 0;
        console.log('Playing: ' + toPlay);
      }

      game[client.id].pile.length = 0;
      game[client.id].p3move.length = 0;
      game[client.id].lastMove.length = 0;
      game[client.id].turn.pattern = patternCode(toPlay);
      game[client.id].turn.player = 'Player 4';
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < game[client.id].p3deck.length; j++) {
          if (toPlay[i] === game[client.id].p3deck[j].code) {
            game[client.id].pile.push(game[client.id].p3deck[j]);
            game[client.id].p3move.push(toPlay[i]);
            game[client.id].lastMove.push(toPlay[i]);
            game[client.id].p3deck.splice(j, 1);
          }
        }
      }
      console.log('Cards Left: ' + game[client.id].p3deck.length);
      console.log('Emitting to: ' + client.id);
      // Winner
      if (game[client.id].p3deck.length === 0) {
        console.log('Winner: Player 3');
        clearInterval(gameTimer);
        io.to(client.id).emit('win', {
          'message': 'Player 3 wins!'
        });
        client.disconnect();
        return;
      }

      io.to(client.id).emit('pile', game[client.id].pile);
      io.to(client.id).emit('cpu', {
        'p2': game[client.id].p2deck.length,
        'p3': game[client.id].p3deck.length,
        'p4': game[client.id].p4deck.length,
        'p2move': game[client.id].p2move,
        'p3move': game[client.id].p3move,
        'p4move': game[client.id].p4move
      });
      io.to(client.id).emit('turn', {'turn': game[client.id].turn});
    }

    else if (game[client.id].turn.player === 'Player 4') {
      console.log('Turn: Player 4');
      if (game[client.id].p1skip + game[client.id].p2skip + game[client.id].p3skip > 2) {
        game[client.id].turn.pattern = '0';
        game[client.id].lastMove.length = 0;
        game[client.id].p1skip = 0;
        game[client.id].p2skip = 0;
        game[client.id].p3skip = 0;
        game[client.id].p4skip = 0;
      }

      var cpuDeck = [];
      for (var i = 0; i < game[client.id].p4deck.length; i++) {
        cpuDeck.push(game[client.id].p4deck[i].code);
      }
      var toPlay = cpuAI(game[client.id].turn.pattern, cpuDeck, game[client.id].lastMove);

      if (toPlay.length === 0) {
        console.log('Skip: Player 4');
        game[client.id].turn.player = client.id;
        game[client.id].p4move.length = 0;
        game[client.id].p4skip = 1;

        // Should probably extract this part later and refactor
        // this entire section since a lot of the code is repeated.
        if (game[client.id].p2skip + game[client.id].p3skip + game[client.id].p4skip > 2) {
          game[client.id].turn.pattern = '0';
          game[client.id].lastMove.length = 0;
          game[client.id].p1skip = 0;
          game[client.id].p2skip = 0;
          game[client.id].p3skip = 0;
          game[client.id].p4skip = 0;
        }
        //

        io.to(client.id).emit('turn', {'turn': game[client.id].turn});
        io.to(client.id).emit('cpu', {
          'p2': game[client.id].p2deck.length,
          'p3': game[client.id].p3deck.length,
          'p4': game[client.id].p4deck.length,
          'p2move': game[client.id].p2move,
          'p3move': game[client.id].p3move
        });
        return;
      }
      else {
        game[client.id].p4skip = 0;
        console.log('Playing: ' + toPlay);
      }

      game[client.id].pile.length = 0;
      game[client.id].p4move.length = 0;
      game[client.id].lastMove.length = 0;
      game[client.id].turn.pattern = patternCode(toPlay);
      game[client.id].turn.player = client.id;
      for (var i = 0; i < toPlay.length; i++) {
        for (var j = 0; j < game[client.id].p4deck.length; j++) {
          if (toPlay[i] === game[client.id].p4deck[j].code) {
            game[client.id].pile.push(game[client.id].p4deck[j]);
            game[client.id].p4move.push(toPlay[i]);
            game[client.id].lastMove.push(toPlay[i]);
            game[client.id].p4deck.splice(j, 1);
          }
        }
      }
      console.log('Cards Left: ' + game[client.id].p4deck.length);
      console.log('Emitting to: ' + client.id);
      // Winner
      if (game[client.id].p4deck.length === 0) {
        console.log('Winner: Player 4');
        clearInterval(gameTimer);
        io.to(client.id).emit('win', {
          'message': 'Player 4 wins!'
        });
        client.disconnect();
        return;
      }
      io.to(client.id).emit('pile', game[client.id].pile);
      io.to(client.id).emit('cpu', {
        'p2': game[client.id].p2deck.length,
        'p3': game[client.id].p3deck.length,
        'p4': game[client.id].p4deck.length,
        'p2move': game[client.id].p2move,
        'p3move': game[client.id].p3move,
        'p4move': game[client.id].p4move
      });
      io.to(client.id).emit('turn', {'turn': game[client.id].turn});
    }
  }, 1000);
};
