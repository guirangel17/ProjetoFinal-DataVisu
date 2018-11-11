var m = {top: 50, right: 150, bottom: 100, left: 150},
	h = 500 - m.top - m.bottom,
	w = 1000 - m.left - m.right,
	barwidth = 5;

var dataset = null;
var data = null;


// Configurações do loader
let opts = {
  lines: 9,
  length: 9,
  width: 5,
  radius: 14,
  color: '#EE3124',
  speed: 1.9,
  trail: 40,
  className: 'spinner',
};


d3.csv('data/top_1000_repositories_stars.csv', function(error, data) {

	if (error)
		throw error;

	var language_stars = [];
	var total_stars = 0;

	// Totaliza as estrelas dos repositórios
	for (var i = 0; i < data.length; i++) {
		language = data[i]['language'];
		num_stars = parseInt(data[i]['num_stars']);

		if (language && language != '\\N' && num_stars) {
			pos = language_stars.findIndex(x => x.language_name === language);

			if (pos >= 0) {
				language_stars[pos].stars += num_stars;
			}
			else {
				language_stars.push({
					language_name: language,
					stars: num_stars
				});
			}

			total_stars += num_stars;
		}
	}


	// Ordena vetor pela quantidade de estrelas
	language_stars.sort(function(a, b) {
		if (a.stars > b.stars) return 1;
		if (a.stars < b.stars) return -1;
		else return 0;
	}).reverse(); 


	// Totaliza percentual de votos dos partidos (duas casas decimais)
	var percentual_acumulado = 0;
	var stars_acumuladas = 0;
	for(var i = 0; i < language_stars.length; i++) {
		stars_acumuladas += language_stars[i].stars;
		language_stars[i].stars_acumuladas = stars_acumuladas;

		language_stars[i].percentual = (language_stars[i].stars / total_stars);
		//language_stars[i].percentual = parseFloat(language_stars[i].percentual.toFixed(2));
		percentual_acumulado += language_stars[i].percentual;
		language_stars[i].percentual_acumulado = percentual_acumulado;
	}

	dataset = data;
	data = language_stars.slice(0,20); // Top 10 linguagens

	// Remove o loader após o carregamento dos dados
	$(".spinner").remove();

	criaGrafico(data);
});


function criaGrafico(data) {
	// Eixos e escalas
	var xScale = d3.scale.ordinal().rangeRoundBands([0, w], 0.15);
	xScale.domain(data.map(function(d) { return d.language_name; }));

	var yhist = d3.scale.linear()
						.domain([0, d3.max(data, function(d) { return d.stars; })])
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

						//div.html("<b>" + partido.nome + "</b><br/>" 
						div.html("<b>" + d.language_name
								+ "</b><br/>"
								+ d.stars.toLocaleString('pt-BR') + " stars <br/>" 
								+ (d.percentual * 100).toFixed(2) + "% do total")	
						.style("left", (d3.event.pageX) + "px")		
						.style("top", (d3.event.pageY - 50) + "px");	
					})					
				.on("mouseout", function(partido) {		
						div.transition()		
						.duration(500)		
						.style("opacity", 0);	
					});

	bar.append("rect")
		.attr("x", function(d) { return xScale(d.language_name); })
		.attr("width", xScale.rangeBand())
		.attr("y", function(d) { return yhist(d.stars); })
		.attr("height", function(d) { return h - yhist(d.stars); });

	// Plota CDF (cumulative distribution function) -> linha cumulativa de pareto
	var guide = d3.svg.line()
				.x(function(d) { return xScale(d.language_name) + (xScale.rangeBand() / 2); })
				.y(function(d){ return ycum(d.percentual_acumulado) });
				//.interpolate('basis');

	var line = svg.append('path')
				.datum(data)
				.attr('d', guide(data))
				.attr('class', 'line');

	// Plota pontos sobre a linha
	svg.selectAll("dot")
		.data(data)
		.enter().append("circle")
		.attr("r", 4.5)
		.attr("class", "dot")
		.attr("cx", function(d) { return xScale(d.language_name) + (xScale.rangeBand() / 2); })
		.attr("cy", function(d) { return ycum(d.percentual_acumulado); })
		.on("mouseover", function(d) {		
						div.transition()		
						.duration(200)		
						.style("opacity", .9);		

						div.html("<b>Acumulado até " + d.language_name
								+ "</b><br/>"
								+ "Número de stars: " + d.stars_acumuladas.toLocaleString('pt-BR') + "<br/>" 
								+ "Percentual: " + (d.percentual_acumulado * 100).toFixed(2) + "%")
						.style("left", (d3.event.pageX) + "px")		
						.style("top", (d3.event.pageY + 10) + "px");	
					})					
		.on("mouseout", function(d) {		
						div.transition()		
						.duration(500)		
						.style("opacity", 0);	
					});

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
			.style("text-anchor", "start");

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -20 - (m.left / 2))
		.attr("x", 0 - (h / 2))
		.attr("dy", ".1em")
		.style("text-anchor", "middle")
		.text("Colunas - Total de stars");

	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + [w, 0] + ")")
		.call(yAxis2)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 20 + (m.right / 2))
		.attr("x", 0 - (h / 2))
		.attr("dy", "-1em")
		.style("text-anchor", "middle")
		.text("Linha - Percentual acumulado de stars");
}