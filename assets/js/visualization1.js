let nUsersCreated = {};
const monthsArray = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
const segColor = (c) => {
  return {
    Janeiro:"#a6cee3", Fevereiro:"#1f78b4",Março:"#b2df8a",
    Abril:"#33a02c", Maio:"#fb9a99",Junho:"#e31a1c",
    Julho:"#fdbf6f", Agosto:"#ff7f00",Setembro:"#cab2d6",
    Outubro:"#6a3d9a", Novembro:"#d8b365",Dezembro:"#8c510a",
    Total: 'grey', 2007:"#8dd3c7", 2008:"#fdae61",2009:"#bebada",
    2010:"#fb8072", 2011:"#80b1d3", 2012:"#b3de69",
    2013:"#de77ae",2014:"#bababa", 2015:"#bc80bd",
    2016:"#80cdc1"
  }[c];
};

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
$('#dashboard').after(spinner);

d3.csv("data/users_with_more_than_1000_commits.csv", function(data) {
  let year = (parseInt(data.created_at)).toString();
  let month = data.created_at.split("-")[1];
  let yearMonth = year + month;

  if(!isNaN(yearMonth)) {
    // Separa os dados pelo mês de cada determinado ano
    nUsersCreated[yearMonth] = (nUsersCreated[yearMonth] || 0) + 1;
  }

  // Remove o spinner da tela quando o carregamento de dados termina
  $(".spinner").remove();

}).then(function () {
  let formattedData = {};

  for (let key in nUsersCreated) {
    let year = key.substr(0,4);
    let monthDigit = key.substr(4,5);
    let month = monthsArray[parseInt(monthDigit,10) - 1]

    formattedData[year] = formattedData[year] ? formattedData[year] : {'months': {}}
    formattedData[year].months[month] = nUsersCreated[key];
  }

  for (let key in formattedData) {
    for(let i in monthsArray) {
      if(!formattedData[key].months[monthsArray[i]]) {
        formattedData[key].months[monthsArray[i]] = 0
      }
    }
  }

  // Forma final dos dados após tratamentos necessários
  let finalData = Object.keys(formattedData).map((key) => {
    return {'year': key, 'months': formattedData[key].months};
  });

  // Função responsável por todos os elementos da tela
  function dashboard(fData, id, dashboardNumber) {
    let memory;

    const barColor = 'grey';

    // Computa o total de usuarios de cada ano
    fData.forEach((d) => {
      d.total = Object.values(d.months).reduce((a, b) => a + b);
    });

    function createHistogram(data) {
      memory = {data: data, color: 'grey', month: 'Total'};

      let hGram = {};
      let hGramDim = {t: 70, r: 0, b: 60, l: 70};
      hGramDim.w = 650 - hGramDim.l - hGramDim.r;
      hGramDim.h = 400 - hGramDim.t - hGramDim.b;

      // Cria o svg do histograma
      let hGramSvg = d3.select(id).append("svg")
          .attr("width", hGramDim.w + hGramDim.l + hGramDim.r)
          .attr("height", hGramDim.h + hGramDim.t + hGramDim.b).append("g")
          .attr("transform", "translate(" + hGramDim.l + "," + hGramDim.t + ")");

      let x = d3.scaleBand()
          .rangeRound([0, hGramDim.w], 0.1)
          .domain(data.map((d) => { return d[0]; }))
          .paddingInner(0.1);

      hGramSvg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + hGramDim.h + ")")
          .call(d3.axisBottom(x));

      let xAxisText;
      if(dashboardNumber == 1) {
        xAxisText = "Anos";
      }
      else {
        xAxisText = "Meses";
      }

      hGramSvg.append("text")
          .attr("transform",
              "translate(" + (hGramDim.w/2) + " ," +
              (hGramDim.h + hGramDim.t - 25) + ")")
          .style("text-anchor", "middle")
          .text(xAxisText);

      let y = d3.scaleLinear()
          .range([hGramDim.h, 0])
          .domain([0, d3.max(data, (d) => { return d[1]; })]);

      hGramSvg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(0,0)")
          .call(d3.axisLeft(y));

      hGramSvg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - hGramDim.l)
          .attr("x",0 - (hGramDim.h / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Número de Usuários");

      // Cria as barras do histograma
      let bars = hGramSvg.selectAll(".bar")
          .data(data)
          .enter()
          .append("g")
          .attr("class", "bar");

      hGramSvg.append("text")
          .attr("x", hGramDim.w/2)
          .attr("y", - hGramDim.t + 20)
          .attr("class", "barTitle")
          .attr("text-anchor", "middle")
          .style("font-size", "18px")
          .style("font-weight", "600")
          .text("Total");

      bars.append("rect")
          .attr("x", (d) => {
            return x(d[0]);
          })
          .attr("y", (d) => {
            return y(d[1]);
          })
          .attr("width", x.bandwidth())
          .attr("height", (d) => {
            return hGramDim.h - y(d[1]);
          })
          .attr('fill', barColor);

      // Cria os labels em cima das barras
      bars.append("text")
          .text((d) => {
            return d3.format(",")(d[1])
          })
          .attr("x", function (d) {
            return x(d[0]) + x.bandwidth() / 2;
          })
          .attr("y", function (d) {
            return y(d[1]) - 5;
          })
          .attr("text-anchor", "middle")
          .attr("class", "barText");

      // Função que atualiza as barras
      hGram.update = function(nD, color, month){
        memory = {data: nD, color: color, month: month};

        y.domain([0, d3.max(nD, (d) =>  { return d[1]; })]);
        x.domain(nD.map((d) => { return d[0]; }));

        let bars = hGramSvg.selectAll(".bar").data(nD);
        let t = d3.transition()
            .duration(500);

        hGramSvg.select(".x.axis")
            .transition(t)
            .call(d3.axisBottom(x));

        hGramSvg.select(".y.axis")
            .transition(t)
            .call(d3.axisLeft(y));

        // transition the height and color of rectangles.
        bars.select("rect").transition().duration(500)
            .attr("y", (d) =>  {return y(d[1]); })
            .attr("height", (d) =>  { return hGramDim.h - y(d[1]); })
            .attr("fill", color);

        // transition the frequency labels location and change value.
        bars.select("text").transition().duration(500)
            .text((d) => { return d3.format(",")(d[1])})
            .attr("y", (d) =>  {return y(d[1])-5; });

        if(!month) {
          month = "Total";
        }

        let barTitle = hGramSvg.selectAll(".barTitle");
        barTitle.text(month);
      }
      return hGram;
    }

    // Função que cria a tabela de legendas
    function createLegend(lD){
      let leg = {};

      let legend = d3.select(id).append("table").attr('class','legend');

      let tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr")
          .on("click", click)
          .on("mouseover", mouseover)
          .on("mouseout", mouseout);

      tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
          .attr("width", '16').attr("height", '16')
          .attr("fill",(d) => { return segColor(d.type); });

      tr.append("td").text((d) => { return d.type;});

      tr.append("td").attr("class",'legendFreq')
          .text((d) => { return d3.format(",")(d.freq);});

      tr.append("td").attr("class",'legendPerc')
          .text((d) => { return getLegend(d,lD);});

      leg.update = function(nD){
        let l = legend.select("tbody").selectAll("tr").data(nD);
        l.select(".legendFreq").text((d) => { return d3.format(",")(d.freq);});
        l.select(".legendPerc").text((d) => { return getLegend(d,nD);});
      }

      function getLegend(d,aD){
        return d3.format(".2%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; }))*2);
      }

      // Trata o evento click para atualizar o gráfico filtrado
      function click(d) {
        if(dashboardNumber == 1) {
          if(d.type == "Total") {
            histogram.update(fData.map(function(v){
              return [v.year,v.total];}), barColor);
          } else {
            histogram.update(fData.map(function(v){
              return [v.year,v.months[d.type]];}),segColor(d.type), d.type);
          }
        }
        else {
          if(d.type == "Total") {
            histogram.update(monthsArray.map((d) => { return [d, d3.sum(fData.map((t) => t.months[d]))]}), barColor);
          }
          else {
            console.log(fData);
            let st = fData.filter(function(s){ return s.year == d.type;})[0];
            let gr = d3.keys(st.months).map((s) => [s, st.months[s]]);
            histogram.update(gr, segColor(d.type), d.type);
          }
        }
      }

      function mouseover(d){
        d3.select(this).style("cursor", "pointer");
      }

      function mouseout(d){
        d3.select(this).style("cursor", "default");
      }

      return leg;
    }

    let buttonId;
    if(dashboardNumber == 1) {
      buttonId = '#sortButton1';
    }
    else {
      buttonId = '#sortButton2';
    }

    // Adiciona o botão de Ordenação na Tela
    d3.select(buttonId).append("button")
        .text("Ordenar")
        .attr("type","button")
        .attr("class","btn btn-default sortButton")
        .on("click", sortData);

    let usersByMonth = monthsArray.map((d) => {
      return {type:d, freq: d3.sum(fData.map(function(t){ return t.months[d];}))};
    });

    let histogram;

    if(dashboardNumber == 1) {
      let acc=0;
      for(let i in usersByMonth) {
        acc = acc + usersByMonth[i].freq;
      }

      let usersByYear = fData.map((d) => {return [d.year,d.total];});
      histogram = createHistogram(usersByYear);

      usersByMonth.push({type: 'Total', freq: acc});
      createLegend(usersByMonth);
    }
    else {
      let usersByYear2 = fData.map((d) => {
        return {type:d.year, freq: d.total};
      });

      let acc=0;
      for(let i in usersByYear2) {
        acc = acc + usersByYear2[i].freq;
      }

      histogram = createHistogram(usersByMonth.map(u => [u.type, u.freq]));
      usersByYear2.push({type: 'Total', freq: acc});
      createLegend(usersByYear2);
    }

    // Função que trata da ordenação dos dados
    function sortData(d) {
      memory.data.sort(function (a, b) {
        return d3.descending(b[1], a[1])
      });
      histogram.update(memory.data, memory.color, memory.month);
    }
  }

  // A função dashboard é chamada duas vezes pois duas visualizações são implementadas na tela
  dashboard(finalData.slice(0,-1), '#dashboard', 1);
  dashboard(finalData.slice(0,-1), '#dashboard2', 2);
});





