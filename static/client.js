console.log("working on it");

var socket = io();

(function () {
  var socket = io();
  socket.to('eventHere', function (data) {
    console.log(data);
  });
})();

