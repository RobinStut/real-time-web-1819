var anwbData;
var kentekenData;
var updatedData;
var clickedJamId;

function socket() {
  var socket = io();
  socket.on('anwbDataObject', function (data) {
    anwbData = data;
  });
  socket.on('updateChangedData', function (data) {
    updatedData = data;
    document.getElementById('d3chart').innerHTML = `<g transform="translate(200, 200)"></g>`
    writeD3(clickedJamId)
  });

}
socket()

const form = document.getElementById('form')
form.addEventListener('submit', async function (e) {
  e.preventDefault()
  var location = navigator.geolocation.getCurrentPosition(success, error);
  var searchBtn = document.getElementById("searchBtn")
  document.getElementById('introText').className = 'displayNone';
  const searchValue = document.getElementById('searchValue');
  // dataKenteken(searchValue)

  const data = await fetch(`/kenteken/${searchValue.value}`)
  const json = await data.json()
  kentekenData = json


})

function success(pos) {
  var lat = pos.coords.latitude;
  var long = pos.coords.longitude;
  var amountOfTrafficJams = anwbData.anwbData.data.trafficJams.length;
  var y = "";
  var trafficJamDistances = []

  for (var y = 0; y < amountOfTrafficJams; y++) {
    var specificLat = anwbData.anwbData.data.trafficJams[y].lat;
    var specificLong = anwbData.anwbData.data.trafficJams[y].long;
    trafficJamDistances.push({
      distanceOfYourPosition: getDistanceFromLatLonInKm(lat, long, specificLat, specificLong),
      anwbData: anwbData.anwbData.data.trafficJams[y],
    })
  }

  trafficJamDistances.sort(function (a, b) {
    return a.distanceOfYourPosition - b.distanceOfYourPosition;
  });
  recentFileStatus(trafficJamDistances)
}

function recentFileStatus(data) {
  var allCurrentJams = document.getElementById('allCurrentJams')
  var formItems = document.getElementById('formItems')
  document.getElementById('allCurrentJams').classList.remove('displayNone')

  for (var i = 0; i < data.length; i++) {
    formItems.insertAdjacentHTML('beforeend', `<input type="radio" id="${data[i].anwbData.jamId}" name="file">
    <label for="${data[i].anwbData.jamId}"><div class="specificJam"><section class="name">${data[i].anwbData.location}</section><section class="delay">${data[i].anwbData.delay/60} min.</section><section class="distance">${data[i].anwbData.distance/1000} km</section></div></label>`);
  }
}

const jamSubmit = document.getElementById('jamForm')
jamSubmit.addEventListener('submit', function (e) {
  e.preventDefault()

  for (var i = 0; i < e.target.length; i++) {
    if (e.target[i].checked) {
      clickedJamId = e.target[i].id;
    }
  }
  document.getElementById('allCurrentJams').className = "displayNone";
  document.getElementById('personalCarDetails').classList.remove('displayNone')
  document.getElementById('carBrand').innerText = kentekenData.data.merk;
  document.getElementById('carType').innerText = kentekenData.data.type;
  document.getElementById('carSeats').innerText = kentekenData.data.plek;
  let carInput = document.getElementById('carInput')
  const kent = kentekenData.data.kent;
  carInput.value = kentekenData.data.plek;

  writeD3v1(clickedJamId)

  carInput.addEventListener('change', async (event) => {
    const data = await fetch(`/carSeatSpots/${clickedJamId}/${carInput.value}/${kent}`)
    const json = await data.json()
  });



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
  return d.toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}






function writeD3(chosenJam) {



  var currentJamStatus = anwbData.anwbData.data.trafficJams;

  function findJamArray(id) {
    return id.jamId === chosenJam;
  }
  var currentJamArray = currentJamStatus.find(findJamArray)

  const exactJamId = String(currentJamArray.jamId)


  var fakeArray = Object.keys(updatedData);


  var fakeIndex = fakeArray.indexOf(exactJamId)

  var nestedValue1 = Object.values(updatedData);

  var nestedValue2 = Object.values(nestedValue1)
  var nestedValue2Array = nestedValue2[fakeIndex];

  var nestedValue3 = Object.values(nestedValue2Array)

  document.getElementById('jamValueIndicator').innerHTML = `${(currentJamArray.distance / 1000) * 130}`


  if (currentJamArray.distance > 0) {
    document.getElementById('carInput').max = `${(currentJamArray.distance / 1000) * 130}`
  }

  var channels = [{
    name: currentJamArray.location,
    quantity: `${(currentJamArray.distance/1000)*130}`,
  }, ];

  if (nestedValue3.length > 0) {
    for (var y = 0; y < nestedValue3.length; y++) {
      channels.push(nestedValue3[y])
    }
  }






  var maxValue = d3.max(channels, function (d) {
    return d.quantity;
  });
  var minValue = d3.min(channels, function (d) {
    return d.quantity;
  });
  var totalValue = d3.sum(channels, function (d) {
    return d.quantity;
  });

  var color = d3.scaleLinear()
    .domain([maxValue, minValue])
    .range([d3.rgb("#1C3448"), d3.rgb("#90b4d2")]);

  var canvas = d3.select("svg");
  var group = d3.select("g");

  var r = 150;

  var arc = d3.arc()
    .outerRadius(r - r * .05)
    .innerRadius(0)
    .cornerRadius(2);

  var arc2 = d3.arc()
    .outerRadius(r + r * .05)
    .innerRadius(0)
    .cornerRadius(2);

  var pieGenerator = d3.pie()
    .value(function (d) {
      return d.quantity;
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

  var arcData = pieGenerator(channels);

  var arcs = group.selectAll(".arc")
    .data(arcData)
    .enter()
    .append("g")
    .attr("class", "arc");

  var arcGeneration = arcs.append("path")
    .attr("d", arc)
    .attr("fill", function (d) {
      return color(d.value);
    })

  var textGeneration = d3.selectAll("g")
    .selectAll(".arc")
    .data(arcData)
    .append('text')
    .each(function (d) {
      var centroid = arc.centroid(d);
      d3.select(this)
        .attr("class", d.data.name)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '-.5em')
        .text(d.data.name);
    });

  var percentGeneration = d3.selectAll("g")
    .selectAll(".arc")
    .data(arcData)
    .append('text')
    .each(function (d) {
      var centroid = arc.centroid(d);
      d3.select(this)
        .attr("class", d.data.name)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '1em')
        .text(Math.round(d.data.quantity * 100 / totalValue) + "%");
    });

  arcGeneration.on("mouseover", function (d) {
    var centroid = arc2.centroid(d);
    var className = d.data.name;
    var translateName = d3.selectAll('.' + className)
      .transition()
      .duration(200)
      .attr('x', centroid[0])
      .attr('y', centroid[1]);
    var translateArc = d3.select(this)
      .transition()
      .duration(200)
      .attr("d", arc2)
    //console.log("inside this "+d.data.name + d.value);

  });

  arcGeneration.on("mouseout", function (d, i) {
    var centroid = arc.centroid(d);
    var className = d.data.name;
    var translateName = d3.selectAll('.' + className)
      .transition()
      .duration(200)
      .attr('x', centroid[0])
      .attr('y', centroid[1]);
    d3.select(this)
      .transition()
      .duration(200)
      .attr("d", arc)

  });



  /*ideas
  asignar un id dinamico al elemento de texto de nombre y valor en cada fraccion que sea igual al valor, en el evento mouseover modificar la posicion X y Y del elemento texto que sea que tenga el id igual al valor que este en turno. :)))))))
  */

}





function writeD3v1(chosenJam) {

  var currentJamStatus = anwbData.anwbData.data.trafficJams;

  function findJamArray(id) {
    return id.jamId === chosenJam;
  }
  var currentJamArray = currentJamStatus.find(findJamArray)

  const exactJamId = String(currentJamArray.jamId)


  var fakeArray = Object.keys(updatedData);


  var fakeIndex = fakeArray.indexOf(exactJamId)

  var nestedValue1 = Object.values(updatedData);

  var nestedValue2 = Object.values(nestedValue1)
  var nestedValue2Array = nestedValue2[fakeIndex];

  var nestedValue3 = Object.values(nestedValue2Array)

  document.getElementById('jamValueIndicator').innerHTML = `${(currentJamArray.distance / 1000) * 130}`


  if (currentJamArray.distance > 0) {
    document.getElementById('carInput').max = `${(currentJamArray.distance / 1000) * 130}`
  }

  var channels = [{
    name: currentJamArray.location,
    quantity: `${(currentJamArray.distance/1000)*130}`,
  }, ];

  var maxValue = d3.max(channels, function (d) {
    return d.quantity;
  });
  var minValue = d3.min(channels, function (d) {
    return d.quantity;
  });
  var totalValue = d3.sum(channels, function (d) {
    return d.quantity;
  });

  var color = d3.scaleLinear()
    .domain([maxValue, minValue])
    .range([d3.rgb("#1C3448"), d3.rgb("#90b4d2")]);

  var canvas = d3.select("svg");
  var group = d3.select("g");

  var r = 150;

  var arc = d3.arc()
    .outerRadius(r - r * .05)
    .innerRadius(0)
    .cornerRadius(2);

  var arc2 = d3.arc()
    .outerRadius(r + r * .05)
    .innerRadius(0)
    .cornerRadius(2);

  var pieGenerator = d3.pie()
    .value(function (d) {
      return d.quantity;
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

  var arcData = pieGenerator(channels);

  var arcs = group.selectAll(".arc")
    .data(arcData)
    .enter()
    .append("g")
    .attr("class", "arc");

  var arcGeneration = arcs.append("path")
    .attr("d", arc)
    .attr("fill", function (d) {
      return color(d.value);
    })

  var textGeneration = d3.selectAll("g")
    .selectAll(".arc")
    .data(arcData)
    .append('text')
    .each(function (d) {
      var centroid = arc.centroid(d);
      d3.select(this)
        .attr("class", d.data.name)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '-.5em')
        .text(d.data.name);
    });

  var percentGeneration = d3.selectAll("g")
    .selectAll(".arc")
    .data(arcData)
    .append('text')
    .each(function (d) {
      var centroid = arc.centroid(d);
      d3.select(this)
        .attr("class", d.data.name)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '1em')
        .text(Math.round(d.data.quantity * 100 / totalValue) + "%");
    });

  arcGeneration.on("mouseover", function (d) {
    var centroid = arc2.centroid(d);
    var className = d.data.name;
    var translateName = d3.selectAll('.' + className)
      .transition()
      .duration(200)
      .attr('x', centroid[0])
      .attr('y', centroid[1]);
    var translateArc = d3.select(this)
      .transition()
      .duration(200)
      .attr("d", arc2)
    //console.log("inside this "+d.data.name + d.value);

  });

  arcGeneration.on("mouseout", function (d, i) {
    var centroid = arc.centroid(d);
    var className = d.data.name;
    var translateName = d3.selectAll('.' + className)
      .transition()
      .duration(200)
      .attr('x', centroid[0])
      .attr('y', centroid[1]);
    d3.select(this)
      .transition()
      .duration(200)
      .attr("d", arc)

  });



  /*ideas
  asignar un id dinamico al elemento de texto de nombre y valor en cada fraccion que sea igual al valor, en el evento mouseover modificar la posicion X y Y del elemento texto que sea que tenga el id igual al valor que este en turno. :)))))))
  */

}