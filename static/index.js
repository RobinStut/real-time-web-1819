console.log("working on it");

var socket = io();

// $(function() {
//   var socket = io();
//   $("form").submit(function(e) {
//     e.preventDefault(); // prevents page reloading
//     socket.emit("chat message", $("#m").val());
//     $("#m").val("");
//     return false;
//   });
//   socket.on("chat message", function(msg) {
//     var print = message(msg);
//     console.log(print);
//     // $("#messages").append($("<li>").text(msg));
//     $("#messages").append($("<li class=`#${print[1]}`>").text(print[0]));
//   });
// });

(function() {
  var socket = io();
  document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();
    socket.emit("chat message", document.querySelector("#m").value);
    document.querySelector("#m").value = "";
    return false;
  });
  socket.on("chat message", function(msg) {
    var newLi = document.createElement("li");
    // console.log(newLi);
    var print = message(msg);
    newLi.textContent = print[0];

    console.log(print);

    newLi.className = `${print[1]}`;

    document.querySelector("#messages").append(newLi);
  });
})();

function message(msg) {
  const rx = /(^[\w\d]+)(:)([^±]*)/g;
  var tst;
  var style;
  var text = msg;
  while ((tst = rx.exec(msg)) !== null) {
    console.log(tst);
    style = tst[1];
    text = tst[3];
  }
  if (style === undefined) {
    style = "";
  }
  return [text, style];
}
