console.log("working on it");

var socket = io();

(function () {
  var socket = io();
  socket.on('eventHere', function (data) {
    console.log(data);
  });
})();

