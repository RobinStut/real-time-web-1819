const express = require("express");
const app = express();
const EventEmitter = require('events');
const fetch = require("node-fetch");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");
const bodyParser = require('body-parser');
require("dotenv").config();
const API_key = process.env.API_key;
const fireBase_key = process.env.fireBase_key;
const fireBase_id = process.env.fireBase_id;
const firebase = require("firebase/app")
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
const port = process.env.PORT || 3000;
const fs = require('fs');
app.use(express.static(path.join(__dirname, "./static")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// const emitter = new EventEmitter()

const firebaseConfig = {
  apiKey: "AIzaSyAEZsebt43wEgd9HZsHS3-c2apCpSbBMDk",
  authDomain: "realtimeweb-robinstut.firebaseapp.com",
  databaseURL: "https://realtimeweb-robinstut.firebaseio.com",
  projectId: "realtimeweb-robinstut",
  storageBucket: "realtimeweb-robinstut.appspot.com",
  messagingSenderId: "136101887671",
  appId: "1:136101887671:web:ab1904b4a9b3b33d"
};

firebase.initializeApp(firebaseConfig);

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
      resolve(data)
    } catch (error) {
      reject(error);
    }
  })
}

function filterANWB(data) {

  var filteredANWBObjects = {}
  var trafficJams = []
  var roadEntriesLength = data.roadEntries.length
  for (var i = 0; i < roadEntriesLength; i++) {


    if (data.roadEntries[i].events.trafficJams.length > 0) {

      var lenghtOfTrafficJams = data.roadEntries[i].events.trafficJams.length

      for (var y = 0; y < lenghtOfTrafficJams; y++) {

        var delay = data.roadEntries[i].events.trafficJams[y].delay;
        var distance = data.roadEntries[i].events.trafficJams[y].distance;

        if (delay === undefined) {
          delay = 0;
        }
        if (distance === undefined) {
          distance = 0;
        }
        var rx1 = /./g;

        const newId = String(`${data.roadEntries[i].events.trafficJams[y].start + data.roadEntries[i].events.trafficJams[y].location}`).replace(rx1, (...x) => `${x[0]}`)




        trafficJams.push({
          jamId: `${newId}`,
          location: data.roadEntries[i].events.trafficJams[y].location,
          lat: data.roadEntries[i].events.trafficJams[y].fromLoc.lat,
          long: data.roadEntries[i].events.trafficJams[y].fromLoc.lon,
          delay: delay,
          distance: distance,
        })
      }
    }

  }
  filteredANWBObjects.date = data.dateTime
  filteredANWBObjects.trafficJams = trafficJams
  return filteredANWBObjects
}

function filterKenteken(data) {
  var filteredKentekenObjects = {
    merk: data.merk,
    type: data.handelsbenaming,
    plek: data.aantal_zitplaatsen,
    kent: data.kenteken
  }
  return filteredKentekenObjects
}
async function anwbAPICall() {

  let data = await dataANWB()
    .then(data => filterANWB(data))


  if (data.trafficJams.length === 0) {
    console.log('zonde zeg, wéér geen file');
    var checkInDb = await firebase.database().ref().child('fakeAnwbData').once('value').then(function (snapshot) {
      return snapshot.val()
    });
    return checkInDb
  }

  if (data.trafficJams.length > 0) {
    const dbRefObject = firebase.database().ref().child('anwbData')


    function writeUserData() {
      try {
        dbRefObject.update({
          data
        });
      } catch (error) {
        console.log(error);
      }

    }
    writeUserData()

    var checkInDb = await firebase.database().ref().child('anwbData').once('value').then(function (snapshot) {
      return snapshot.val()
    });

    return checkInDb
  }
}
anwbAPICall()
setInterval(anwbAPICall, 180000);


app.get("/carSeatSpots/:jamId/:carInput/:kent", async function (req, res) {
  var currentJamId = req.params.jamId
  var carInput = req.params.carInput
  var kent = req.params.kent

  function writeData() {
    const dbRefObject = firebase.database().ref().child(`/updatedData/${currentJamId}/${kent}/`)
    dbRefObject.set({
      name: kent,
      quantity: carInput
    });
  }
  writeData()


});

app.get("/kenteken/:id", async function kentekenAPICall(req, res) {
  var searchValue = req.params.id.toUpperCase();
  var data;

  var checkInDb = await firebase.database().ref().child(`/kentekens/${searchValue}/`).once('value').then(function (snapshot) {
    return snapshot.val()
  });


  if (checkInDb === null) {
    var rawData = await dataKenteken(searchValue);
    data = await filterKenteken(rawData)


    function writeData() {
      const dbRefObject = firebase.database().ref().child(`/kentekens/${searchValue}/`)
      dbRefObject.set(data);
    }
    writeData()
    // emitter.emit('newData', data);
  } else {
    data = checkInDb
  }
  res.json({
    data
  })
});

io.on("connection", async function (socket) {

  var anwbData = await anwbAPICall();

  socket.emit('anwbDataObject', {
    anwbData
  });

  const updateAnwbData = firebase.database().ref().child('anwbData')

  updateAnwbData.on('value', snap => {
    socket.emit('updateAnwbData',
      snap.val()
    );
  });


  const updateChangedData = firebase.database().ref().child('updatedData')

  updateChangedData.on('value', snap => {

    socket.emit('updateChangedData',
      snap.val()
    );
  });



  function kentekenEmit(data) {
    var kentekenObj = {
      merk: data.merk,
      type: data.handelsbenaming,
      stoelen: data.aantal_zitplaatsen
    }

    socket.emit('kentekenData', {
      kentekenData: kentekenObj
    });

  }
});

server.listen(port, function () {
  console.log("listening on *:3000");
});