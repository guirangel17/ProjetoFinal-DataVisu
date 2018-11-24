var ANO_MIN = 2008;
var ANO_MAX = 2016;

var graficoNaoUtilizado = true; // Indica se é a página foi carregada pela primeira vez
var languages = [];

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

let spinner = new Spinner(opts).spin().el;
$('#conteudo').after(spinner);

// Define as dimensões e as margens do gráfico
var margin = {top: 50, right: 150, bottom: 100, left: 150},
	width = 950 - margin.left - margin.right,
	height = 470 - margin.top - margin.bottom;

// Define os intervalos
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Define a linha
var valueline = d3.line()
	.x(function(d) { return x(d.year)})
	.y(function(d) { return y(d.created_repos)})

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
					
// Recebe os dados
d3.csv("data/repositories_per_month_languages.csv", function(error, data) {
	if (error) 
		throw error;

	// Formata os dados
	repositories = [];
	for (var i = 0; i < data.length; i++) {
		linguagem = data[i]['language'];
		ano = data[i]['year'];
		mes = data[i]['month'];
		num_repositorios = parseInt(data[i]['created_repos']);

		// Vamos analisar apenas anos com dados dos 12 meses
		if (ano >= ANO_MIN && ano <= ANO_MAX) {
			pos = repositories.findIndex(x => x.language === linguagem && x.year === ano);
			if (pos >= 0) {
				repositories[pos].created_repos += num_repositorios;
			}
			else
				repositories.push({
					language: linguagem,
					year: ano,
					created_repos: num_repositorios
				});

			// Adiciona entrada para todas as linguagens
			pos = repositories.findIndex(x => x.language === 'Todas' && x.year === ano);
			if (pos >= 0) {
				repositories[pos].created_repos += num_repositorios;
			}
			else
				repositories.push({
					language: 'Todas',
					year: ano,
					created_repos: num_repositorios
				});
		}
	}

	// Remove o loader após o carregamento dos dados
	$(".spinner").remove();

	//
	x.domain([ANO_MIN, ANO_MAX]);
	y.domain([0, d3.max(repositories, function(d) { return d.created_repos; })]);

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
		.text("Repositórios criados");

	atualizaGrafico();
});



function atualizaGrafico() {
	// Define o intervalo dos dados
	x.domain([ANO_MIN, ANO_MAX]);
	y.domain([0, d3.max(repositories, function(d) { return d.created_repos; })]);

	// Adiciona as linhas de cada linguagem
	languages = [];
	document.querySelectorAll('input[type="checkbox"]:checked').forEach(function (d) {
		languages.push(d.value);
	});

	// Se não tem nenhuma linguagem selecionada, começa com as linguagens mais populares
	if (graficoNaoUtilizado) {
		languages = ['Todas'];
		graficoNaoUtilizado = false;
	}
	

	if (languages.length < QTD_MAX_CORES) {
		
		// Remove linhas que estavam plotadas antes
		svg.selectAll(".line").remove();
		svg.selectAll("circle").remove();
		svg.selectAll("#legend").remove();
		
		// Verifica tamanho máximo do eixo y
		var globalMax = 0;
		for (i = 0; i < languages.length; i++) {
			repositories_per_language = repositories.filter(x => x.language === languages[i]);
			
			var temp = repositories_per_language.map(x => x.created_repos);
			var localMax = temp.reduce(function (a, b) {
								return Math.max(a,b);
							});
			globalMax = (localMax > globalMax) ? localMax : globalMax;
		}
		
		// Atualiza tamanho do eixo y
		var t = d3.transition().duration(200);
		
		y.domain([0, globalMax]);
		svg.select("#y-axis")
				.transition(t)
				.call(yAxis);
		
		
		// Adiciona as linhas de cada linguagem
		for (i = 0; i < languages.length; i++) {
			repositories_per_language = repositories.filter(x => x.language === languages[i]);

			// Plota linha
			svg.append("path")
				.datum(repositories_per_language)
				.attr("class", "line")
				.attr("stroke", color_palette(i))
				.attr("d", valueline);
				
			// Plota legenda da liniha
			var language_name = (repositories_per_language[repositories_per_language.length - 1].language == "\\N") ? "Sem Linguagem" : repositories_per_language[repositories_per_language.length - 1].language;
			svg.append("text")
				.attr("id", "legend")
				.attr("transform", "translate(" + x(repositories_per_language[repositories_per_language.length - 1].year) + "," + y(repositories_per_language[repositories_per_language.length - 1].created_repos) + ")")
				.attr("x", 10)
				.attr("dy", ".35em")
				.text(language_name);

			// Plota pontos sobre a linha
			svg.selectAll("dot")
				.data(repositories_per_language)
				.enter().append("circle")
				.attr("r", 4.5)
				.attr("class", "dot")
				.attr("fill", color_palette(i))
				.attr("cx", function(d) { return x(d.year); })
				.attr("cy", function(d) { return y(d.created_repos); })
				.on("mouseover", function(d) {		
								div.transition()		
								.duration(200)		
								.style("opacity", .9);		
		
								div.html("<b>" + d.language + "</b><br/>"
										+ "Repositórios criados em " + d.year + ": " + d.created_repos.toLocaleString('pt-BR'))	
								.style("left", (d3.event.pageX) + "px")		
								.style("top", (d3.event.pageY + 10) + "px");	
							})					
				.on("mouseout", function(d) {		
								div.transition()		
								.duration(500)		
								.style("opacity", 0);	
							});
		}
	}
	
	// Se não tem nenhuma linguagem selecionada, eixo padrão
	if (languages.length == 0)	{
		y.domain([0, d3.max(repositories, function(d) { return d.created_repos; })]);
		var t = d3.transition().duration(200);
		svg.select("#y-axis")
				.transition(t)
				.call(yAxis);
	}
}