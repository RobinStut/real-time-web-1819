const express = require("express");
const app = express();
const fetch = require("node-fetch");
const server = require("http").Server(app);
const request = require('request');
const io = require("socket.io")(server);
const path = require("path");

const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "./static")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function fetchData() {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await fetch('https://www.anwb.nl/feeds/gethf')
      let data = await result.json()
      resolve(data)
    } catch (error) {
      reject(error);
    }
  })
}

console.log('test');

app.get("/", (req, res) => {
  var options = {
    url:
      "https://api.overheid.io/voertuiggegevens/47XBFJ",
    headers: {
      "Content-Type": "application/json",
      "ovio-api-key": "cb4a5098d72831700cb8dfe2111a783f2d114eadf910dff79a902a619877dd39",
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      console.log(data);
      res.render("../views/pages/index.ejs", {
        data: data.payload
      });
    } else {
      console.log(error);
    }
  }
  request(options, callback);
});


// app.get("/", async (req, res) => {
//   try {
//     const data = await fetchData()
//       .then(data => filter(data))
//       .then(render => {
//         res.render("pages/index", {
//           ANWB: render
//         });
//       });

//   } catch (error) {
//     console.log(error);
//   }
// });


function filter(x) {
  const road = x.roadEntries.map(obj => {
    const trafficJams = obj.events.trafficJams.map(obj2 => {
      return [obj.road, obj2.distance, obj2.delay, obj2.from, obj2.to];
    })
    console.log(trafficJams);
    // console.log(road + ' ' + trafficJams);
    const data = {
      // road: road,
      distance: trafficJams[0],
      delay: trafficJams[1],
      from: trafficJams[2],
      to: trafficJams[3]
    }
    // console.log(data);
  })
}

io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
  socket.on("chat message", function (msg) {
    // console.log(result);
    io.emit("chat message", result);
  });
});

server.listen(port, function () {
  console.log("listening on *:3000");
});