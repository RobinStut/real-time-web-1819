const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");
const Filter = require('bad-words'),
  filter = new Filter();

const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "./static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("pages/index"));

io.on("connection", function (socket) {
  console.log("a user connected");
  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
  socket.on("chat message", function (msg) {
    var result = filter.clean(msg)
    // console.log(result);
    io.emit("chat message", result);
  });
});

server.listen(port, function () {
  console.log("listening on *:3000");
});



