console.log("working on it");

var socket = io();

(function () {
  var socket = io();
  document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    socket.emit("chat message", document.querySelector("#m").value);
    document.querySelector("#m").value = "";
    return false;
  });
  socket.on("chat message", function (msg) {
    var newLi = document.createElement("li");
    var print = message(msg);
    newLi.innerHTML = print[0];

    // console.log(print);

    newLi.className = `${print[1]}`;

    document.querySelector("#messages").append(newLi);
  });
})();

function message(msg) {
  const rx = /(^[\w\d]+)(:)([^±]*)/g;
  const rx2 = /(.)/g;
  var tst;
  var tst2;
  var style;
  var text = msg;
  var i = 0;
  while ((tst = rx.exec(msg)) !== null) {
    style = tst[1];
    console.log(style);
    text = tst[3];
  }
  if (style === undefined) {
    style = "";
  }
  if (style === 'wave') {
    const span = text.replace(rx2, (...arg) => {
      // console.log(arg[1]);
      if (i <= 5) {
        i++
      }
      if (i === 6) {
        i = 1;
      }
      return `<span class="sp${i}">${arg[1]}</span>`;

    });
    text = span;
  }

  return [text, style];
}
