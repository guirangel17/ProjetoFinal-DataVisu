var m = {top: 50, right: 150, bottom: 100, left: 150},
	h = 500 - m.top - m.bottom,
	w = 1000 - m.left - m.right,
	barwidth = 5;

function pulls() {

	var arquivo =  "data/repositories_stats.csv";

  d3.select("svg").remove();

	d3.csv(arquivo, function(error, data) {

		if (error)
			throw error;

		repositories = [];
		var total_repos = 0;

		for (var i = 0; i < data.length; i++) {

			language = data[i]['language']
			if (language && language != '\\N') {
				num_repos = parseInt(data[i]['repositories']);
				num_issues = parseInt(data[i]['num_issues']);
				num_pulls = parseInt(data[i]['pull_requests']);
				total_repos += num_repos;

				pos = repositories.findIndex(x => x.language === language);
				if (pos >= 0) {
					repositories[pos].repos += num_repos;
					repositories[pos].num_issues += num_issues;
					repositories[pos].num_pulls += num_pulls;
				}
				else
				 repositories.push({
					 language: language,
					 repos: num_repos,
					 num_issues: num_issues,
					 num_pulls: num_pulls,
				 });
			}
		}

		// Ordena vetor pela quantidade de issues
		repositories.sort(function(a, b) {
			if (a.num_pulls > b.num_pulls) return 1;
			if (a.num_pulls < b.num_pulls) return -1;
			else return 0;
		}).reverse();

		data = repositories.slice(0,20); // Top 20 linguagens com mais pull requests

		// Eixos e escalas
		var xScale = d3.scale.ordinal().rangeRoundBands([0, w], 0.15);
		xScale.domain(data.map(function(d) { return d.language; }));

		var yhist = d3.scale.linear()
							.domain([0, d3.max(data, function(d) { return d.num_pulls; })])
							.range([h, 0]);

		var ycum = d3.scale.linear().domain([0, 1]).range([h, 0]);

		var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient('bottom');

		var yAxis = d3.svg.axis()
						.scale(yhist)
						.tickFormat(function(d){ return d.toLocaleString('pt-BR'); })
						.orient('left');

		var yAxis2 = d3.svg.axis()
						.scale(ycum)
						.tickFormat(function(d){ return d*100 + "%"; })
						.orient('right');

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

		// Plota histograma
		var bar = svg.selectAll(".bar")
					.data(data)
					.enter().append("g")
					.attr("class", "bar")
					.on("mouseover", function(d) {
							div.transition()
							.duration(200)
							.style("opacity", .9);

							div.html("<b>" + d.language
									+ "</b><br/>"
									+ d.num_pulls.toLocaleString('pt-BR') + " pull requests <br/>")
							.style("left", (d3.event.pageX) + "px")
							.style("top", (d3.event.pageY - 50) + "px");
						})
					.on("mouseout", function(d) {
							div.transition()
							.duration(500)
							.style("opacity", 0);
						});

		bar.append("rect")
			.attr("x", function(d) { return xScale(d.language); })
			.attr("width", xScale.rangeBand())
			.attr("y", function(d) { return yhist(d.num_pulls); })
			.attr("height", function(d) { return h - yhist(d.num_pulls); });

		// Plota eixos
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + h + ")")
			.call(xAxis)
			.selectAll("text")
				.attr("y", 6)
				.attr("x", 5)
				.attr("dy", "1em")
				.attr("transform", "rotate(45)")
				.style("text-anchor", "start")
				.attr("font-size", "15px");

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.attr("font-size", "15px")
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -20 - (m.left / 2))
			.attr("x", 0 - (h / 2))
			.attr("dy", ".1em")
			.style("text-anchor", "middle")
			.text("Nº de pull requests")
			.attr("font-size", "18px");
	});
}
