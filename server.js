const express = require("express");
const app = express();
const fetch = require("node-fetch");
const http = require("http");
const https = require('https');
const server = require("http").Server(app);
const fs = require('fs');
const io = require("socket.io")(server);
const path = require("path");
const bodyParser = require('body-parser');
require("dotenv").config();
const API_key = process.env.API_key;
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "./static")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


fs.readFile("lastAPICall.txt", function (err, buf) {
  console.log(buf.toString());
});





app.post("/", async (req, res) => {
  var searchValue = req.body.search;
  console.log("search value =", searchValue)
  try {
    const data = await dataKenteken(searchValue)
  } catch (error) {
    console.log(error);
  }
});

app.get("/", async (req, res) => {
  try {
    const data = await dataANWB()
      .then(data => filterANWB(data))
      .then(render => {
        res.render("pages/index", {
          ANWB: render
        });
      });

  } catch (error) {
    console.log(error);
  }
});



function dataKenteken(searchValue) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await fetch('https://api.overheid.io/voertuiggegevens/' + searchValue, {
        headers: {
          "Content-Type": "application/json",
          "ovio-api-key": API_key,
        },
      })
      let data = await result.json()
      console.log(data);
      resolve(data)
    } catch (error) {
      reject(error);
    }
  })
}

function dataANWB() {
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

function filterANWB(x) {
  return new Promise(async (resolve, reject) => {
    const road = x.roadEntries.map(obj => {
      // console.log(obj);


      return (obj);
    })
    console.log(x.dateTime);
    // console.log(road);
    // road = JSON.parse(road)

    resolve(road)

  })
}






io.on("connection", async function (socket) {
  async function openRequest() {
    try {
      let data = await dataANWB()
        // .then(console.log(data))
        .then(data => filterANWB(data))
        .then((data) => {
          let detailedInfo = data.map(obj => { return obj.events.trafficJams });
          detailedInfo = detailedInfo.map(obj => {
            if (typeof obj[0] == 'object') {
              var dataset = {
                delay: obj[0].delay,
                distance: obj[0].distance,
                from: obj[0].from,
                to: obj[0].to,
                location: obj[0].location
              }
              // console.log(dataset);
              return dataset
            }
          })
          // console.log(detailedInfo);
          return (detailedInfo)
        })
      // console.log(data);
      return (data);
      // resolve(data)
    } catch (error) {
      console.log(error);
    }
  }


  // console.log(await openRequest());
  console.log("a user connected");
  const result = await openRequest();
  // console.log(result);

  // socket.to(`${socketId}`).emit('eventHere', { hello: result });

  socket.emit('eventHere', { hello: result });

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

server.listen(port, function () {
  console.log("listening on *:3000");
});