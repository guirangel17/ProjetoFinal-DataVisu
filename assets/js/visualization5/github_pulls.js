var ANO_MIN = 2008;
var ANO_MAX = 2016;

var m = {top: 50, right: 150, bottom: 100, left: 150},
	h = 500 - m.top - m.bottom,
	w = 1200 - m.left - m.right,
	barwidth = 5;

function pullsPorLinguagem() {
  	var dataset = null;

  	var lang = document.getElementById("lang").value;

  	// Caso de contorno
  	if (lang == "")
  		return;

    d3.select("svg").remove();

  	var arquivo =  "data/repositories_stats.csv";

  	d3.csv(arquivo, function(error, data) {

  		if (error)
  			return console.log(error);

      repositories = [];
  		var total_repos = 0;

  		// Totaliza número de projetos por ano
  		for (var i = 0; i < data.length; i++) {
  			// Retorna dados apenas para a linguagem desejada
  			if (data[i]['language'] == lang) {
  				year = data[i]['year'];
  				num_repos = parseInt(data[i]['repositories']);
  				num_issues = parseInt(data[i]['num_issues']);
  				num_pulls = parseInt(data[i]['pull_requests']);
  				total_repos += num_repos;

  				repositories.push({
  					year: year,
  					repos: num_repos,
  					num_issues: num_issues,
  					num_pulls: num_pulls,
  					issues: (num_issues/num_repos),
  					pulls: (num_pulls/num_repos)
  				});
  			}
  		}

      // Define as dimensões e as margens do gráfico
      var margin = {top: 50, right: 150, bottom: 100, left: 150},
      	width = 1000 - margin.left - margin.right,
      	height = 500 - margin.top - margin.bottom;

      // Define os intervalos
      var x = d3.scaleLinear().range([0, width]);
      var y = d3.scaleLinear().range([height, 0]);

      // Define a linha
      var valueline = d3.line()
      	.x(function(d) { return x(d.year)})
      	.y(function(d) { return y(d.pulls)})

      // Caixa de informações
      var div = d3.select("#grafico").append("div")
      			.attr("class", "tooltip")
      			.style("opacity", 0);

      // Adiciona o gráfico ao corpo da página
      var svg = d3.select("#grafico").append("svg")
      			  .attr("width", width + margin.left + margin.right)
      			  .attr("height", height + margin.top + margin.bottom)
      			.append("g")
      			  .attr("transform",
      					"translate(" + margin.left + "," + margin.top + ")");


      // Define e adiciona os eixos
      var xAxis = d3.axisBottom(x)
      			.tickFormat(function (d) {
      					return d * 1000 / 1000;
      				});

      var yAxis = d3.axisLeft(y)
      			.tickFormat(function (d) {
      					return d.toLocaleString('pt-BR');
      				});

  		// Caixa de informações
  		var div = d3.select("body").append("div")
  					.attr("class", "tooltip")
  					.style("opacity", 0);

  		// Plota svg
  		var svg = d3.select("#chart").append("svg")
  					.attr("width", w + m.left + m.right)
  					.attr("height", h + m.top + m.bottom)
  					.append("g")
  					.attr("transform", "translate(" + m.left + "," + m.top + ")");

            //
            x.domain([ANO_MIN, ANO_MAX]);
            y.domain([0, d3.max(repositories, function(d) { return d.pulls; })]);

            // Adiciona o eixo X
            svg.append("g")
              .attr("id", "x-axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

            // Adiciona o eixo Y
            svg.append("g")
              .attr("id", "y-axis")
              .call(yAxis);

            svg.append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 0 - (margin.left / 2))
              .attr("x", 0 - (height / 2))
              .attr("dy", ".1em")
              .style("text-anchor", "middle")
              .text("Nº de pull requests/repositórios");
              svg.append("path")
                .datum(repositories)
                .attr("class", "line")
                .attr("stroke", color_palette(i))
                .attr("d", valueline);
                // Plota pontos sobre a linha
          			svg.selectAll("dot")
          				.data(repositories)
          				.enter().append("circle")
          				.attr("r", 4.5)
          				.attr("class", "dot")
          				.attr("fill", color_palette(i))
          				.attr("cx", function(d) { return x(d.year); })
          				.attr("cy", function(d) { return y(d.pulls); })
          				.on("mouseover", function(d) {
          								div.transition()
          								.duration(200)
          								.style("opacity", .9);

													div.html("<b>" + lang + "-" + d.year + "</b><br/>"
													+ "Nº de repositórios: " + d.repos.toLocaleString('pt-BR') + "<br/>"
													+ "Nº de pull requests: " + d.num_issues.toLocaleString('pt-BR') + "<br/>"
          								+ "Pull requests/repositório:" + d.issues.toLocaleString('pt-BR'))
          								.style("left", (d3.event.pageX) + "px")
          								.style("top", (d3.event.pageY + 10) + "px");
          							})
          				.on("mouseout", function(d) {
          								div.transition()
          								.duration(500)
          								.style("opacity", 0);
          							});
  	});
  }
