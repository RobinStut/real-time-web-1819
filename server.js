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
const emitter = new EventEmitter()

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
  console.log('filterANWB');
  // console.log(data);
  var filteredANWBObjects = {}
  var trafficJams = []
  var roadEntriesLength = data.roadEntries.length
  console.log('roadEntries length = ' + data.roadEntries.length);
  for (var i = 0; i < roadEntriesLength; i++) {
    // console.log('first for');
    // console.log(i);

    if (data.roadEntries[i].events.trafficJams.length > 0) {

      var lenghtOfTrafficJams = data.roadEntries[i].events.trafficJams.length
      // console.log('length of trafic jams = ' + lenghtOfTrafficJams);

      for (var y = 0; y < lenghtOfTrafficJams; y++) {
        // console.log(y);
        // console.log('115');
        // console.log(data.roadEntries[i].events.trafficJams);
        var delay = data.roadEntries[i].events.trafficJams[y].delay;
        var distance = data.roadEntries[i].events.trafficJams[y].distance;

        if (delay === undefined) {
          delay = 0
        }
        if (distance === undefined) {
          delay = 0
        }

        trafficJams.push({
          jamId: data.roadEntries[i].events.trafficJams[y].msgNr,
          location: data.roadEntries[i].events.trafficJams[y].location,
          lat: data.roadEntries[i].events.trafficJams[y].fromLoc.lat,
          long: data.roadEntries[i].events.trafficJams[y].fromLoc.lon,
          delay: delay,
          distance: distance,
        })
      }
    }

  }
  // console.log('136');
  // console.log(filteredANWBObjects);
  filteredANWBObjects.date = data.dateTime
  filteredANWBObjects.trafficJams = trafficJams
  // console.log('endOfFilterANWB');
  // console.log(filteredANWBObjects);
  return filteredANWBObjects
}

function filterKenteken(data) {
  console.log('filterKentekenBegin');
  // console.log(data);
  var filteredKentekenObjects = {
    merk: data.merk,
    type: data.handelsbenaming,
    plek: data.aantal_zitplaatsen
  }
  console.log(filteredKentekenObjects);
  console.log('filterKentekenEind');
  return filteredKentekenObjects
}

async function anwbAPICall() {

  let data = await dataANWB()
    .then(data => filterANWB(data))

  // console.log('datalog = ');
  // console.log(data);

  if (data.trafficJams.length === 0) {
    console.log('zonde zeg, wéér geen file');
    var checkInDb = await firebase.database().ref().child('fakeAnwbData').once('value').then(function (snapshot) {
      console.log(snapshot.val());
      return snapshot.val()
    });
    console.log('checkInDb');
    console.log(checkInDb);
  }

  if (data.trafficJams.length > 0) {
    const dbRefObject = firebase.database().ref().child('anwbData')

    function writeUserData() {
      // console.log('writeUserData');
      dbRefObject.set({
        current: data
      });
    }
    writeUserData()

    var checkInDb = await firebase.database().ref().child('anwbData').once('value').then(function (snapshot) {
      // console.log(snapshot.val());
      return snapshot.val()
    });

    return checkInDb

    // dbRefObject.on('value', snap => {
    // console.log(snap.val())
    // console.log('time is change');
    // socket.emit('anwbDataObject', {
    //   anwbData: snap.val()
    // });
    // });
  }
}
setInterval(anwbAPICall, 60000);

app.get("/kenteken/:id", async function kentekenAPICall(req, res) {
  var searchValue = req.params.id.toUpperCase();
  console.log("search value =", searchValue)

  var checkInDb = await firebase.database().ref().child(searchValue).once('value').then(function (snapshot) {
    return snapshot.val()
  });

  console.log('checkInDb');
  console.log(checkInDb);

  if (checkInDb === null) {
    console.log('if=0');
    var rawData = await dataKenteken(searchValue);
    var data = await filterKenteken(rawData)

    function writeData() {
      const dbRefObject = firebase.database().ref().child(searchValue)
      dbRefObject.set(data);
    }
    writeData()
    emitter.emit('newData', data);
  }
});

io.on("connection", async function (socket) {
  console.log('onConnect');

  emitter.on('newData', (data) => {
    console.log('239');
    console.log(data);
    // socket.emit('newDataGathered', )
  })



  var anwbData = await anwbAPICall();
  console.log(anwbData);

  socket.emit('anwbDataObject', {
    anwbData
  });


  function kentekenEmit(data) {
    console.log('kentekenEmit');
    // console.log(data);
    var kentekenObj = {
      merk: data.merk,
      type: data.handelsbenaming,
      stoelen: data.aantal_zitplaatsen
    }
    console.log(kentekenObj);

    socket.emit('kentekenData', {
      kentekenData: kentekenObj
    });

    console.log('endOfEmit');
  }
});

server.listen(port, function () {
  console.log("listening on *:3000");
});