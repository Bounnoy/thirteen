var toPlay = [];

var socket = io.connect('http://192.168.1.128:8000');
//var socket = io.connect('http://192.168.0.12:8000');

socket.on('cpu', function(sData) {
  $('#p2').text(sData.p2);
  if (sData.p2move) {
    var moves = sData.p2move.join(', ');
    moves = moves.replace(/S/g, '&spades;');
    moves = moves.replace(/C/g, '&clubs;');
    moves = moves.replace(/D/g, '<font color=red>&diams;</font>');
    moves = moves.replace(/H/g, '<font color=red>&hearts;</font>');
    moves = moves.replace(/0/g, '10');
    $('#p2').append('<br>' + moves);
  } else $('#p2').append('<br>Skip');

  $('#p3').text(sData.p3);
  if (sData.p3move) {
    var moves = sData.p3move.join(', ');
    moves = moves.replace(/S/g, '&spades;');
    moves = moves.replace(/C/g, '&clubs;');
    moves = moves.replace(/D/g, '<font color=red>&diams;</font>');
    moves = moves.replace(/H/g, '<font color=red>&hearts;</font>');
    moves = moves.replace(/0/g, '10');
    $('#p3').append('<br>' + moves);
  } else $('#p3').append('<br>Skip');

  $('#p4').text(sData.p4);
  if (sData.p4move) {
    var moves = sData.p4move.join(', ');
    moves = moves.replace(/S/g, '&spades;');
    moves = moves.replace(/C/g, '&clubs;');
    moves = moves.replace(/D/g, '<font color=red>&diams;</font>');
    moves = moves.replace(/H/g, '<font color=red>&hearts;</font>');
    moves = moves.replace(/0/g, '10');
    $('#p4').append('<br>' + moves);
  } else $('#p4').append('<br>Skip');
});

socket.on('pile', function(sData) {
  $('#pile').empty();
  for (var i = 0; i < sData.length; i++) {
    if (i === 6) $('#pDeck').append('<br>');

    $(document.createElement("img"))
        .attr({ src: sData[i].image, style: "width: 10%; margin: 2px" })
        .appendTo('#pile');
  }
});

socket.on('turn', function(sData) {
  if (sData.turn.player === socket.id) {
    $('#playerBtn').empty();
    $('#btnReset').show();
    if (sData.turn.pattern != '0') {
      $('#btnSkip').show();
    } else {
      $('#playerBtn').prepend(`<p>No one else can go, play any pattern.</p>`);
    }
    $('#btnPlay').show();
  } else {
    $('#playerBtn').empty().prepend(`<p>${sData.turn.player}'s turn...</p>`);
    $('#btnReset').hide();
    $('#btnSkip').hide();
    $('#btnPlay').hide();
  }
});

socket.on('win', function(sData) {
  $('#btnReset').hide();
  $('#btnSkip').hide();
  $('#btnPlay').hide();
  $('#playerBtn').empty().prepend(`<p style="color: "#d4f">${sData.message}</p>`);
  $('#playerDeck').append('<button id="newGame" type="button" class="btn btn-primary mr-2 mb-2">Play Again</button>');
  // $(document.createElement("img"))
  //     .attr({ src: sData[i].image, style: "width: 10%; margin: 2px" })
  //     .appendTo('#pile');
});

socket.on('game', function(sData) {
  toPlay.length = 0;
  $('#playerBtn').empty();
  $('#pDeck').empty();
  for (var i = 0; i < sData.length; i++) {
    if (i === 6) $('#pDeck').append('<br>');

    $(document.createElement("img"))
        .attr({ src: sData[i].image, style: "width: 10%; margin: 2px" })
        .appendTo('#pDeck')
        .data({'code': sData[i].code, 'select': false})
        .click(function() {
            if ($(this).data('select') === false) {
              $(this).data('select', true);
              $(this).css({
                'border': "solid 1px #d4f",
                'border-radius': "5px",
                'box-shadow': "0 0 9px #caf"
              });

              toPlay.push($(this).data('code'));
            } else {
              $(this).data('select', false);
              $(this).css({
                'border': "none",
                'box-shadow': "0 0 0"
              });

              for (var i = 0; i < toPlay.length; i++) {
                if (toPlay[i] === $(this).data('code')) {
                  toPlay.splice(i, 1);
                }
              }
            }
            console.log($(this).data('code'));
            console.log($(this).data('select'));
            console.log(toPlay);
        });
  }
});

socket.on('badPattern', (mes) => {
  $('#playerBtn').empty().prepend('<p style="color: red">' + mes.message + '</p>');
});

$('#btnPlay').on('click', () => {
  socket.emit('play', toPlay);
});

$('#btnSkip').on('click', () => {
  socket.emit('skip');
});

$('#newGame').on('click', () => {
  socket.emit('newGame');
  $('#newGame').detach();
})
