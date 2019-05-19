const express = require("express");
const app = express();
const fetch = require("node-fetch");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");
const bodyParser = require('body-parser');
require("dotenv").config();
const API_key = process.env.API_key;
const fireBase_key = process.env.fireBase_key;
const fireBase_id = process.env.fireBase_id;
const port = process.env.PORT || 3000;
const fs = require('fs');
app.use(express.static(path.join(__dirname, "./static")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// import util from 'util'
// import fs from 'fs'
// import path from 'path'

// const readFile = util.promisify(fs.readFile)
// const writeFile = util.promisify(fs.writeFile)

const databasePath = path.join(__dirname, './kentekenAPIdata.json')

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

const admin = require('firebase-admin');

var serviceAccount = require('./static/realtimeweb-robinstut-firebase-adminsdk-5ejoj-bd02b49279.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();

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

function filterANWB(data) {
  var filteredANWBObjects = {}
  var trafficJams = []
  var roadEntriesCount = "";

  for (var i = 0; i < 9; i++) {

    if (data.roadEntries[i].events.trafficJams.length > 0) {
      var lenghtOfTrafficJams = data.roadEntries[i].events.trafficJams.length
      var y = "";
      for (var y = 0; y < lenghtOfTrafficJams; y++) {
        trafficJams.push({
          location: data.roadEntries[i].events.trafficJams[y].location,
          lat: data.roadEntries[i].events.trafficJams[y].fromLoc.lat,
          long: data.roadEntries[i].events.trafficJams[y].fromLoc.lon,
          delay: data.roadEntries[i].events.trafficJams[y].delay,
          distance: data.roadEntries[i].events.trafficJams[y].distance
        })
      }
    }
    roadEntriesCount = roadEntriesCount + i;
  }

  filteredANWBObjects.date = data.dateTime
  filteredANWBObjects.trafficJams = trafficJams

  return filteredANWBObjects
}

io.on("connection", async function (socket) {
  async function openRequest() {
    // console.log('openRequest aangeroepen');
    try {
      let data = await dataANWB()
        .then(data => filterANWB(data))
      return (data);
    } catch (error) {
      console.log(error);
    }
  }
  // openRequest()

  async function anwbAPICall() {
    // console.log('anwbAPICall aangeroepen');
    const resultOfANWBdataRequest = await openRequest();
    // console.log(resultOfANWBdataRequest);
    socket.emit('anwbDataObject', {
      anwbData: resultOfANWBdataRequest
    });
  }
  anwbAPICall();
  // setInterval(anwbAPICall, 3000);

  app.get("/kenteken/:id", async function (req, res) {
    var searchValue = req.params.id.toUpperCase();
    console.log("search value =", searchValue)

    db.collection('kenteken').get()
      .then(async (snapshot) => {
        var alreadyExist = false;
        snapshot.forEach((doc) => {
          if (doc.id === searchValue) {
            alreadyExist = true;
          }
        });
        if (alreadyExist === true) {
          var matchingResult = db.collection('kenteken');
          var allResultsInDb = [];

          var allRetreivedResults = await matchingResult.get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                allResultsInDb.push({
                  id: doc.id,
                  data: doc.data()
                }, )
              });
            })

          var retreivedMatchingResult = await matchingResult.doc(searchValue).get()
            .then(async doc => {
              return doc.data()
            })

          // console.log(allResultsInDb);
          socket.emit('kentekenData', {
            specificData: retreivedMatchingResult,
            allData: allResultsInDb
          });
        }
        if (alreadyExist === false) {
          try {
            getData()
          } catch (error) {
            console.log(error);
          }
        }
      })
      .catch((err) => {
        console.log('Error getting documents', err);
      });


    async function getData() {
      const data = await dataKenteken(searchValue)
      addToDatabase(data)

    }

    function addToDatabase(data) {
      var docRef = db.collection('kenteken').doc(data.kenteken);
      var addKentekenDataToDatabase = docRef.set(data);
    }

  });

  // async function anwbAPICall() {
  //   const result = await openRequest();

  //   socket.emit('eventHere', {
  //     anwb: result
  //   });
  // }
  // anwbAPICall();
  // setInterval(anwbAPICall, 180000);

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

server.listen(port, function () {
  console.log("listening on *:3000");
});