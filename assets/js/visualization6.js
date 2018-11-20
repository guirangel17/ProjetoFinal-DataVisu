
pullsPorLinguagem();

function pullsPorLinguagem() {

  	var arquivo =  "data/repositories_stats.csv";

  	d3.csv(arquivo, function(error, data) {

  		if (error)
  			return console.log(error);

      repositories = [];
  		var total_repos = 0;

  		// Totaliza número de projetos por ano
  		for (var i = 0; i < data.length; i++) {
  			// Retorna dados apenas para a linguagem desejada
        language = data[i]['language']
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

      for(var i = 0; i < repositories.length; i++) {
        repositories[i].issues = repositories[i].num_issues/repositories[i].repos;
        repositories[i].pulls = repositories[i].num_pulls/repositories[i].repos;
		  }

      data = repositories

      // Define as dimensões e as margens do gráfico
      var margin = {top: 50, right: 150, bottom: 100, left: 150},
      	width = 1000 - margin.left - margin.right,
      	height = 500 - margin.top - margin.bottom;

      // Define os intervalos
      var x = d3.scaleLinear().range([0, width]).nice();
      var y = d3.scaleLinear().range([height, 0]).nice();

      var color = d3.scaleOrdinal(d3.schemeCategory10);

      var xAxis = d3.axisBottom(x);
      var yAxis = d3.axisLeft(y);

      // Caixa de informações
      var div = d3.select("body").append("div")
      			.attr("class", "tooltip")
      			.style("opacity", 0);

      var svg = d3.select("body").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(data, function(d) { return Math.log(d.issues); }));
      y.domain(d3.extent(data, function(d) { return Math.log(d.pulls); }));

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end");

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end");

      svg.append("text")
         .attr("transform", "rotate(0)")
         .attr("y", 30 + height)
         .attr("x", 0 + (width / 2))
         .attr("dy", ".1em")
         .style("text-anchor", "middle")
         .text("Nº de issues (log)")
         .attr("font-size", "15px");

      svg.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 0 - (margin.left / 2))
         .attr("x", 0 - (height / 2))
         .attr("dy", ".1em")
         .style("text-anchor", "middle")
         .text("Nº de pull requests (log)")
         .attr("font-size", "15px");

      svg.selectAll(".dot")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr('stroke','black')
          .attr('stroke-width',0.5)
          .attr("cx", function(d) { return x(Math.log(d.issues)); })
          .attr("cy", function(d) { return y(Math.log(d.pulls)); })
          .on("mouseover", function(d) {
                  d3.select(this)
                    .transition()
                    .duration(500)
                    .attr('r',15)
                    .attr('stroke-width',1)
                    .style("opacity", .7);

                  div.transition()
                  .duration(200)
                  .style("opacity", .9);

                  div.html("<b>" + d.language + "</b><br/>"
                  + "Nº de repositórios: " + d.repos.toLocaleString('pt-BR') + "<br/>"
                  + "Nº de issues: " + d.num_issues.toLocaleString('pt-BR') + "<br/>"
                  + "Nº de pull requests: " + d.num_pulls.toLocaleString('pt-BR') + "<br/>"
                  + "Issues/repositório:" + d.issues.toLocaleString('pt-BR') + "<br/>"
                  + "Pull requests/repositório:" + d.pulls.toLocaleString('pt-BR'))
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY + 10) + "px");
              })
         .on("mouseout", function(d) {
                 d3.select(this)
                  .transition()
                  .duration(500)
                  .attr('r', 3.5)
                  .attr('stroke-width', 0.5)
                 div.transition()
                 .duration(500)
                .style("opacity", 0);
              });
  	});
}
