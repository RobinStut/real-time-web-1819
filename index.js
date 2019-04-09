const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");

app.use(express.static(path.join(__dirname, "./static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => res.render("pages/index"));

io.on("connection", function(socket) {
  console.log("a user connected");
});

io.on("connection", function(socket) {
  socket.on("disconnect", function() {
    console.log("user disconnected");
  });
});
io.on("connection", function(socket) {
  socket.on("chat message", function(msg) {
    console.log("message: " + msg);
  });
});
io.on("connection", function(socket) {
  socket.on("chat message", function(msg) {
    io.emit("chat message", msg);
  });
});

server.listen(3000, function() {
  console.log("listening on *:3000");
});
