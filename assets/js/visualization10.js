function createVisualization() {
  // Configurações do loader
  const opts = {
    lines: 9,
    length: 9,
    width: 5,
    radius: 14,
    color: '#EE3124',
    speed: 1.9,
    trail: 40,
    className: 'spinner',
  };

  let spinner = new Spinner(opts).spin().el;
  $('#canvas-svg').after(spinner);

  d3.json("data/repos_by_country.json", function(err, data) {
    let config = {
      "data0":"country_name",
      "data1":"count",
      "label0":"label 0",
      "label1":"label 1",
      "color0":"#fc9272",
      "color1":"#de2d26",
      "width":960,
      "height":960
    }

    let width = config.width;
    let height = config.height;
    const COLOR_COUNTS = 100;

    function generateColors(colorStart,colorEnd,colorCount){
      // Inicio do gradiente de cores
      let start = hexToRgb(colorStart);

      // Fim do gradiente
      let end = hexToRgb(colorEnd);

      // Número de cores
      let len = colorCount;

      let alpha = 0.0;
      let saida = [];

      for (let i = 0; i < len; i++) {
        let c = [];
        alpha += (1.0/len);

        c[0] = start.r * alpha + (1 - alpha) * end.r;
        c[1] = start.g * alpha + (1 - alpha) * end.g;
        c[2] = start.b * alpha + (1 - alpha) * end.b;

        saida.push(new Color(c[0], c[1], c[2]));
      }

      return saida;
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

    let colors = generateColors(COLOR_LAST, COLOR_FIRST, COLOR_COUNTS);

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

    data.forEach(function(d) {
      valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
    });

    let quantize = d3.scale.quantize()
        .domain([0, 1.0])
        .range(d3.range(COLOR_COUNTS)
            .map((i) => { return i }));

    quantize.domain(
        [d3.min(data, (d) => {
          return (+d[MAP_VALUE])
        }),
          d3.max(data, (d) => {
            return (+d[MAP_VALUE])
          })]
    );

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

    $(".spinner").remove();
  });
}

function createLegend() {
  let w = 130, h = 300;

  let key = d3.select("body")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "svg-legend");

  let legend = key.append("defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "100%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");

  legend.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#de2d26")
      .attr("stop-opacity", 1);

  legend.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fc9272")
      .attr("stop-opacity", 1);

  key.append("rect")
      .attr("width", w - 100)
      .attr("height", h - 100)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(0,10)");

  let y = d3.scale.linear()
      .range([200, 0])
      .domain([0, 5680172]);

  let yAxis = d3.svg.axis()
      .scale(y)
      .orient("right");

  key.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(41,10)")
      .call(yAxis.tickFormat(d3.format(".2s")));

  d3.select("g")
      .append("text")
      .attr("transform", "rotate(-90), translate(0,10)")
      .attr("y", 30)
      .attr("dy", ".71em")
      .attr("font-weight", "bold")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .text("Nº de repositórios");
}

createVisualization();
createLegend();


