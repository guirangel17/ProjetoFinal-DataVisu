var commitsAgrupados = {};
var dadosFinais = new Array();

var margin = {
    top: 10,
    right: 10,
    bottom: 110,
    left: 80
};

var width = 800 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

// Transition
var t = d3.transition().duration(750);

var group = d3.select('#chart-area')
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// Tooltip 
var tip = d3.tip()
        .attr("class", "d3-tip")
        .html(function(d) {
            var texto = "<strong>Empresa: </strong> <span>" + d.empresa + "</span><br>";
            texto += "<strong>Commits: </strong> <span>" + d3.format(",")(d.commits) + "</span><br>";
            return texto;
        });
group.call(tip);

var xAxisGroup = group.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", "translate(0, " + height + ")");
                       
var yAxisGroup = group.append("g")
                    .attr("class", "y-axis");

// X Scale
var x = d3.scaleBand()
    .range([0, width])
    .paddingInner(0.3)
    .paddingOuter(0.3);

// Y Scale
var y = d3.scaleLinear()
    .range([height, 0]);

// X Label
group.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + 100)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Empresas");

// Y Label
var yLabel = group.append("text")
    .attr("class", "y-axis-label")
    .attr("x", - (height / 2))
    .attr("y", -60)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Commits");

d3.csv("data/companys_commits.csv").then((data) => {

    //console.log(data[0]);

    data.forEach(element => {
        // Somar valores de commits de cada empresa por periodo de tempo.
        if (commitsAgrupados.hasOwnProperty( element.company)) {
            commitsAgrupados[element.company] += +element.num_commits;
        }
        else {
            commitsAgrupados[element.company] = +element.num_commits;
        }
    });
    
    commitsAgrupados = ordenarPorValor(commitsAgrupados);

    for (var company in commitsAgrupados) {
        dadosFinais.push({
            "empresa": company, 
            "commits": commitsAgrupados[company]
        });
    }

    atualizarDados(dadosFinais);

}).catch((error) => {
    console.log(error);
});

// Funcao para ordenar com base na quantidade de commits por empresa.
function ordenarPorValor(dados) {

    var dadosOrdenados = {};
    var listaOrdenada = [];
    
    for (var empresa in dados) {
        listaOrdenada.push([empresa, dados[empresa]]);
    }

    listaOrdenada.sort(function(a, b) {
        return b[1] - a[1];
    });

    listaOrdenada = listaOrdenada.slice(0, 20);

    for(var i = 0; i < listaOrdenada.length; i++ ) {
        dadosOrdenados[listaOrdenada[i][0]] = listaOrdenada[i][1]; 
    }
    
    return dadosOrdenados;
}

// Montar e atualizar dados na tela
function atualizarDados(dados) {
    
    x.domain(dados.map( d => { return d.empresa; }));  

    y.domain([0, d3.max(dados, (d) => { return d["commits"]; })]);

    // Eixo X
    var xAxisCall = d3.axisBottom(x);
    xAxisGroup.transition(t).call(xAxisCall)
        .selectAll("text")
            .attr("x", "-5")
            .attr("y", "10")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-30)");    
    
    // Eixo Y
    var yAxisCall = d3.axisLeft(y)
        .tickFormat(d => { return d; });
    yAxisGroup.transition(t).call(yAxisCall);
        
    // JOIN - novos dados em elementos antigos.
    var rects = group.selectAll("rect")
        .data(dados, (d) => {
            return d.empresa;
        });
    
    // EXIT - Remover elementos que nao serao mais mostrados.
    rects.exit()
        .attr("fill", "red")
    .transition(t)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();

    // ENTER - Novos elementos para mostrar.
    rects.enter()
        .append("rect")
        .attr("x", (d) => { return x(d.empresa) })
        .attr("y", (d) => { return y(0); })
        .attr("width", x.bandwidth)
        .attr("heigh", 0)
        .attr("fill", "#6298ef")
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        // AND UPDATE - atualizar elementos com novos dados.
        .merge(rects)
    .transition(t)
        .attr("y", (d) => { return y(d["commits"]); })
        .attr("height", (d) => { return height - y(d["commits"]) });
        //.attr("r", x.bandwidth)

}