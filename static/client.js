console.log("working on it");

var socket = io();
var anwbData;

(function () {
  var socket = io();
  socket.on('eventHere', function (data) {
    document.getElementById('anwbData').innerHTML = '';
    dataChange(data)
    // dataRender(anwbData)
  });
  socket.on('hey', function (data) {
    console.log(data);
  });
})();


function dataRender(data) {
  // console.log(data);
  var item = document.getElementById('anwbData')
  // console.log(item);

  data.map(x => {
    // console.log(x);
    item.innerHTML = "test";
    item.insertAdjacentHTML("beforeend", x);
  })

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
    if (x !== null && x.delay > 0) {
      // console.log(x);
      var test = {
        name: x.location,
        value: x.delay
      }
      console.log(test);
      d3Data.push(test)
    }


  })
  console.log(d3Data);

  writeProgram(d3Data)

}



function writeProgram(data) {

  var width = 700,
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
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
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