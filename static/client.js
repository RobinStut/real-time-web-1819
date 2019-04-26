console.log("working on it");

// var socket = io();
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

const form = document.getElementById('form')
form.addEventListener('submit', function (e) {
  e.preventDefault()
  const searchValue = document.getElementById('searchValue');
  fetch(`/kenteken/${searchValue.value}`)
    .then(res => res.json()
      .then(data => console.log(data))
      .then(data => barChart(24)))
})


function barChart(valueData) {
  console.log('test');

  var w = 300;
  var h = 120;
  var padding = 2;
  var dataset = [valueData, 23, 18, 9, 7];
  var svg = d3.select("article").append("svg")
    .attr("width", w)
    .attr("height", h);

  function colorPicker(v) {
    if (v <= 20) {
      return "#666666";
    } else if (v > 20) {
      return "#FF0033";
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
      // console.log(x);
      var test = {
        name: x.location,
        value: x.delay
      }
      // console.log(test);
      d3Data.push(test)
    }
  })
  // console.log(d3Data);

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