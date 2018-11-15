d3.csv("data/commits_by_country.csv", function(err, data) {
  let config = {
    "data0":"Country (or dependent territory)",
    "data1":"Population",
    "label0":"label 0",
    "label1":"label 1",
    "color0":"#c6dbef",
    "color1":"#08306b",
    "width":960,
    "height":960
  }

  let width = config.width;
  let height = config.height;
  const COLOR_COUNTS = 9;

  function Interpolate(start, end, steps, count) {
    let s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
    return Math.floor(final);
  }

  function Color(_r, _g, _b) {
    let r, g, b;
    let setColors = function(_r, _g, _b) {
      r = _r;
      g = _g;
      b = _b;
    };

    setColors(_r, _g, _b);
    this.getColors = function() {
      let colors = {
        r: r,
        g: g,
        b: b
      };
      return colors;
    };
  }

  function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }

  let COLOR_FIRST = config.color0;
  let COLOR_LAST = config.color1;

  let rgb = hexToRgb(COLOR_FIRST);

  let COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

  rgb = hexToRgb(COLOR_LAST);
  let COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

  let startColors = COLOR_START.getColors()
  let endColors = COLOR_END.getColors();

  let colors = [];

  for (let i = 0; i < COLOR_COUNTS; i++) {
    let r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    let g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    let b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }

  let MAP_KEY = config.data0;
  let MAP_VALUE = config.data1;

  let projection = d3.geo.mercator()
      .scale((width + 1) / 2 / Math.PI)
      .translate([width / 2, height / 2])
      .precision(.1);

  let path = d3.geo.path()
      .projection(projection);

  let graticule = d3.geo.graticule();

  let svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

  let valueHash = {};

  function log10(val) {
    return Math.log(val);
  }

  data.forEach(function(d) {
    valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
  });

  let quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

  quantize.domain([d3.min(data, function(d){
    return (+d[MAP_VALUE]) }),
    d3.max(data, function(d){
      return (+d[MAP_VALUE]) })]);

  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    let countries = topojson.feature(world, world.objects.countries).features;

    svg.append("path")
        .datum(graticule)
        .attr("class", "choropleth")
        .attr("d", path);

    let g = svg.append("g");

    g.append("path")
        .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
        .attr("class", "equator")
        .attr("d", path);

    let country = g.selectAll(".country").data(countries);

    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
          if (valueHash[d.properties.name]) {
            let c = quantize((valueHash[d.properties.name]));
            let color = colors[c].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
          } else {
            return "#ccc";
          }
        })
        .on("mousemove", function(d) {
          let html = "";

          html += "<div class=\"tooltip_kv\">";
          html += "<span class=\"tooltip_key\">";
          html += d.properties.name;
          html += "</span>";
          html += "<span class=\"tooltip_value\">";
          html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
          html += "";
          html += "</span>";
          html += "</div>";

          $("#tooltip-container").html(html);
          $(this).attr("fill-opacity", "0.8");
          $("#tooltip-container").show();

          let coordinates = d3.mouse(this);

          let map_width = $('.choropleth')[0].getBoundingClientRect().width;

          if (d3.event.pageX < map_width / 2) {
            d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
          } else {
            let tooltip_width = $("#tooltip-container").width();
            d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
          }
        })
        .on("mouseout", function() {
          $(this).attr("fill-opacity", "1.0");
          $("#tooltip-container").hide();
        });

    g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);

    svg.attr("height", config.height * 2.2 / 3);
  });

  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
});

// let nCommitsByCountry = {};
//
// d3.csv("users_with_more_than_1000_commits.csv", function (err, data) {
//   data.forEach((d) => {
//     let nCommits = parseInt(d.num_commits);
//     let country = d.country_code;
//
//     nCommitsByCountry[country] = (nCommitsByCountry[country] || 0) + nCommits;
//   });
//
//   console.log(nCommitsByCountry);
// });