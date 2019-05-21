console.log("working on it");

var anwbData;
var kentekenData;

function socket() {
  var socket = io();
  socket.on('anwbDataObject', function (data) {
    console.log('anwbDataObjectSocket');
    anwbData = data;
  });
  socket.on('kentekenData', function (data) {
    console.log('kentekenDataSocket');
    console.log(data);
    kentekenData = data;
  });
}
socket()

const form = document.getElementById('form')
form.addEventListener('submit', function (e) {
  e.preventDefault()
  var location = navigator.geolocation.getCurrentPosition(success, error);
  var searchBtn = document.getElementById("searchBtn")
  console.log(searchBtn);
  document.getElementById('introText').className = 'displayNone';
  const searchValue = document.getElementById('searchValue');
  console.log(searchValue.value);

  fetch(`/kenteken/${searchValue.value}`)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      return data
    })

})

function success(pos) {
  var lat = pos.coords.latitude;
  var long = pos.coords.longitude;
  // console.log(anwbData);
  var amountOfTrafficJams = anwbData.anwbData.current.trafficJams.length;
  var y = "";
  var trafficJamDistances = []
  console.log(`lat = ${lat}, long = ${long}`);

  for (var y = 0; y < amountOfTrafficJams; y++) {
    var specificLat = anwbData.anwbData.current.trafficJams[y].lat;
    var specificLong = anwbData.anwbData.current.trafficJams[y].long;
    trafficJamDistances.push({
      distanceOfYourPosition: getDistanceFromLatLonInKm(lat, long, specificLat, specificLong),
      anwbData: anwbData.anwbData.current.trafficJams[y],
    })
  }

  trafficJamDistances.sort(function (a, b) {
    return a.distanceOfYourPosition - b.distanceOfYourPosition;
  });
  recentFileStatus(trafficJamDistances)
}

function recentFileStatus(data) {
  console.log(data);
  var allCurrentJams = document.getElementById('allCurrentJams')
  var formItems = document.getElementById('formItems')
  console.log(formItems);
  document.getElementById('allCurrentJams').classList.remove('displayNone')

  for (var i = 0; i < data.length; i++) {
    formItems.insertAdjacentHTML('beforeend', `<input type="radio" id="${data[i].anwbData.jamId}" name="file">
    <label for="${data[i].anwbData.jamId}"><div class="specificJam"><section class="name">${data[i].anwbData.location}</section><section class="delay">${data[i].anwbData.delay/60} min.</section><section class="distance">${data[i].anwbData.distance/1000} km</section></div></label>`);
  }
}

const jamSubmit = document.getElementById('jamForm')
jamSubmit.addEventListener('submit', function (e) {
  e.preventDefault()
  // console.log(e);
  var clickedJamId;
  for (var i = 0; i < e.target.length; i++) {
    if (e.target[i].checked) {
      clickedJamId = e.target[i].id;
    }
  }
  console.log(clickedJamId);
  document.getElementById('allCurrentJams').className = "displayNone";
  document.getElementById('personalCarDetails').classList.remove('displayNone')
  console.log(kentekenData);
  document.getElementById('carBrand').innerText = kentekenData.kentekenData.merk;
  document.getElementById('carType').innerText = kentekenData.kentekenData.type;
  document.getElementById('carSeats').innerText = kentekenData.kentekenData.stoelen;
})

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

function remove(id) {
  var item = document.getElementById(id)
  document.getElementById(id).innerHTML = "";
}

//  bron: http://www.movable-type.co.uk/scripts/latlong.html

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  // console.log(`${d.toFixed(1)}Km`);
  return d.toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}