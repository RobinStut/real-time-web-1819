console.log("working on it");

var anwbData;

(function () {
  var socket = io();
  socket.on('anwbDataObject', function (data) {
    // console.log(data);
    anwbData = data;
    document.getElementById('anwbData').innerHTML = '';
  });
  socket.on('kentekenData', function (data) {
    console.log(data);
  });

})();


function dataRender(data) {
  var item = document.getElementById('anwbData')

  data.map(x => {
    item.innerHTML = "test";
    item.insertAdjacentHTML("beforeend", x);
  })
}

const form = document.getElementById('form')
form.addEventListener('submit', function (e) {
  e.preventDefault()

  var location = navigator.geolocation.getCurrentPosition(success, error);
  var kentekenData

  const searchValue = document.getElementById('searchValue');
  console.log(searchValue.value);

  fetch(`/kenteken/${searchValue.value}`)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      kentekenData = data;
      return data
    })

})

function success(pos) {
  var lat = pos.coords.latitude;
  var long = pos.coords.longitude;
  var amountOfTrafficJams = anwbData.anwbData.trafficJams.length;
  var y = "";
  var trafficJamDistances = []
  console.log(`lat = ${lat}, long = ${long}`);

  for (var y = 0; y < amountOfTrafficJams; y++) {
    var specificLat = anwbData.anwbData.trafficJams[y].lat;
    var specificLong = anwbData.anwbData.trafficJams[y].long;
    trafficJamDistances.push({
      distanceOfYourPosition: getDistanceFromLatLonInKm(lat, long, specificLat, specificLong),
      anwbData: anwbData.anwbData.trafficJams[y],
    })
  }

  trafficJamDistances.sort(function (a, b) {
    return a.distanceOfYourPosition - b.distanceOfYourPosition;
  });

  console.log(trafficJamDistances);
  // getDistanceFromLatLonInKm(lat, long, 52.353761, 4.638322)
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

function remove(id) {
  var item = document.getElementById(id)
  document.getElementById(id).innerHTML = "";
}

async function dataChange(value) {
  anwbData = Object.entries(value)[0][1];
  var d3Data = [];
  var re = /([\w]+[\d]+)/;
  anwbData = await anwbData.map(x => {
    if (x !== null && x.delay > 600) {
      var test = {
        name: x.location,
        value: x.delay
      }
      d3Data.push(test)
    }
  })

  writeProgram(d3Data)

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

// D3 
function barChart(valueData) {
  var legenda = document.getElementById('legenda')
  legenda.innerHTML = "<p>test</p>";

  console.log('test');
  var w = 200;
  var h = 200;
  var padding = 2;
  var dataset = [valueData, 5.8,
    11,
    5.2,
    8.2
  ];
  var svg = d3.select("article").append("svg")
    .attr("width", w)
    .attr("height", h);

  function colorPicker(v) {
    if (v === 5.8) {
      return "#743bef";
    }
    if (v === 11) {
      return "#4286f4";
    }
    if (v === 5.2) {
      return "#41dcf4";
    }
    if (v === 8.2) {
      return "#41f4b2";
    } else {
      return "#ef9c3e";
    }
  }

  svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr({
      "x": function (d, i) {
        return i * (w / dataset.length);
      },
      "y": function (d) {
        return h - (d * 4);
      },
      "width": w / dataset.length - padding,
      "height": function (d) {
        return d * 4;
      },
      "fill": function (d) {
        return colorPicker(d);
      }
    });

  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function (d) {
      return d;
    })
    .attr({
      "text-anchor": "middle",
      x: function (d, i) {
        return i * (w / dataset.length) + (w / dataset.length - padding) / 2;
      },
      y: function (d) {
        return h - (d * 4) + 14;
      },
      "font-family": "sans-serif",
      "font-size": 10,
      "fill": "#ffffff"
    })
}

function writeProgram(data) {

  var width = 900,
    height = 500,
    radius = Math.min(width, height) / 2;

  var arc = d3.svg.arc()
    .outerRadius(radius - 100)
    .innerRadius(0);

  var labelArc = d3.svg.arc()
    .outerRadius(220)
    .innerRadius(0);

  var color = d3.scale.ordinal()
    .range(["#ff3300", "#ff9933", "#ffcc00", "#ff8800", "#99ff33", "#009900"]);


  var pie = d3.layout.pie()
    .value(function (d) {
      return d.value;
    });

  var svg = d3.select("section").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 3 + "," + height / 2 + ")");
  var g = svg.selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .style("fill", function (d) {
      return color(d.data.value);
    });

  var total = d3.sum(data, function (d) {
    return d.value;
  });

  g.append("text")
    .attr("transform", function (d) {
      return "translate(" + labelArc.centroid(d) + ")";
    })
    .attr("dy", ".35em")
    .attr("fill", "#ffffff")
    .text(function (d) {
      return Math.round(100 * d.data.value / total) + "%";
    });

  var legendY = -150;
  g.append("text")
    .attr("dy", function (d) {
      return legendY += 30;
    })
    .attr("dx", 200)
    .attr("fill", "#000000")
    .text(function (d) {
      return d.data.name;
    });

  legendY = -150 - 5;
  g
    .append("circle")
    .attr("fill", function (d) {
      return color(d.data.value);
    })
    .attr("r", 6)
    .attr("cy", function (d) {
      return legendY += 30;
    })
    .attr("cx", 190);
}