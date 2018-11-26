const MONTH_NAMES = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
]

const DATASETS = {
    COMMITS_BY_MONTH_OF_YEAR: {
        data: [],
        filename: 'data/commits_by_month_of_year.json'
    },
    COMMITS_BY_DAY_OF_MONTH_PER_MONTH: {
        data: {},
        filename: 'data/commits_by_day_of_month_per_month.json'
    },
    COMMITS_BY_DAY_OF_MONTH: {
        data: [],
        filename: 'data/commits_by_day_of_month.json'
    },
    COMMITS_BY_DAY_OF_WEEK: {
        data: [],
        filename: 'data/commits_by_day_of_week.json'
    },
    COMMITS_BY_HOUR: {
        data: [],
        filename: 'data/commits_by_hour.json'
    },
    COMMITS_COUNT: {
        data: 0,
        filename: 'data/commits_count.json'
    }
}

async function loadDatasets() {
    let datasetPromises = _.mapValues(DATASETS, d => fetch(d.filename).then(r => r.json()))
    let datasetValues = await Promise.props(datasetPromises)

    for (let [key, value] of Object.entries(datasetValues)) {
        DATASETS[key].data = value
    }
}

function renderSvg() {
    return d3.select('#vis')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('transform', 'translate(-1 0)')
}

function renderTimesOfDay(svg1) {
    let margin = {top: 40, right: 5, bottom: 10, left: 50}

    let barHeight = 150;
    let formatNumber = d3.format("s");

    let data = DATASETS.COMMITS_BY_HOUR.data

    let midWidth = svg1.node().clientWidth / 2
    let svg = svg1.append('g')
        .attr('transform', `translate(${midWidth}, ${barHeight + 30})`)

    let extent = d3.extent(data, function (d) {
        return d.count
    })

    let barScale = d3.scaleLinear()
        .domain(extent)
        .range([0, barHeight])

    let keys = data.map(function (d, i) {
        return d.hour
    })
    let numBars = keys.length

    let x = d3.scaleLinear()
        .domain(extent)
        .range([0, -barHeight])

    let xAxis = d3.axisLeft(x)
        .ticks(3)
        .tickFormat(formatNumber)

    let circles = svg.selectAll('circle')
        .data(x.ticks(3))
        .enter().append('circle')
        .attr('r', function (d) {
            return barScale(d)
        })
        .style('fill', 'none')
        .style('stroke', 'none')
        .style('stroke-dasharray', '2,2')
        .style('stroke-width', '.5px')

    let arc = d3.arc()

    let segments = svg.selectAll('path')
        .data(data)
        .enter().append('path')
        .each(function (d, i) {
            d.innerRadius = 0
            d.outerRadius = barScale(+d.count)
            d.startAngle = (i * 2 * Math.PI) / numBars
            d.endAngle = ((i + 1) * 2 * Math.PI) / numBars
        })
        .style('fill', function (d) {
            return 'rgb(25, 102, 172)'
        })
        .attr('d', arc)

    svg.append('circle')
        .attr('r', barHeight)
        .classed('outer', true)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', '1.5px')

    let lines = svg.selectAll('line')
        .data(keys)
        .enter().append('line')
        .attr('y2', -barHeight - 20)
        .style('stroke', 'black')
        .style('stroke-width', '.5px')
        .attr('transform', function (d, i) {
            return 'rotate(' + (i * 360 / numBars) + ')'
        })

    // svg.append('g')
    //     .attr('class', 'x axis')
    //     .call(xAxis)

    // Labels
    let labelRadius = barHeight * 1.025

    let labels = svg.append('g')
        .classed('labels', true)

    labels.append('def')
        .append('path')
        .attr('id', 'label-path')
        .attr('d', 'm0 ' + -labelRadius + ' a' + labelRadius + ' ' + labelRadius + ' 0 1,1 -0.01 0')

    labels.selectAll('text')
        .data(data)
        .enter().append('text')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('fill', function (d, i) {
            return '#3e3e3e'
        })
        .append('textPath')
        .attr('class', 'textpath')
        .attr('xlink:href', '#label-path')
        .attr('startOffset', function (d, i) {
            return i * 100 / numBars + 50 / numBars + '%'
        })
        .text(function (d) {
            return `${d.hour}`
        })
}

function renderMonths(svg) {
    let margin = {top: 20, right: 5, bottom: 30, left: 5}

    let svgNode = svg.node()
    let x = d3.scaleBand()
        .domain(DATASETS.COMMITS_BY_MONTH_OF_YEAR.data.map(d => d.month))
        .range([margin.left, svgNode.clientWidth - margin.right])
        .paddingInner(0.1)

    let monthColorPercentiles = [
        '#a7e8a0',
        '#83c47a',
        '#64a659',
        '#488b3d'
    ]

    function quantile(data, percentile) {
        data.sort((a, b) => a - b)

        let index = percentile / 100. * (data.length - 1)
        let result

        if (Math.floor(index) === index) {
            result = data[index]
        } else {
            let i = Math.floor(index)
            let fraction = index - i
            result = data[i] + (data[i + 1] - data[i]) * fraction
        }

        return result
    }

    let data = DATASETS.COMMITS_BY_MONTH_OF_YEAR.data.map(v => v.count)
    let percentile25 = quantile(data, 25)
    let percentile50 = quantile(data, 50)
    let percentile75 = quantile(data, 75)

    let getColor = value => {
        if (value <= percentile25) return monthColorPercentiles[0]
        if (value <= percentile50) return monthColorPercentiles[1]
        if (value <= percentile75) return monthColorPercentiles[2]

        return monthColorPercentiles[3]
    }


    let allMonths = svg.append('g')
        .selectAll('rect')
        .data(DATASETS.COMMITS_BY_MONTH_OF_YEAR.data)
        .enter()

    let baseY = svgNode.clientHeight - x.bandwidth() - margin.bottom
    allMonths.append('rect')
        .attr('x', d => x(d.month))
        .attr('y', baseY)
        .attr('height', x.bandwidth())
        .attr('width', x.bandwidth())
        .attr('fill', d => getColor(d.count))
        // .attr('stroke', '#195929')
        // .attr('stroke-width', '1px')
        // .attr('stroke-dasharray', '10 5')
        .attr('data-month', d => d.month)

    allMonths.append('text')
        .attr('y', baseY + (x.bandwidth() / 2))
        .attr('x', d => x(d.month) + (x.bandwidth() / 2.0))
        .attr('fill', '#000')
        .classed('month-name-text', true)
        .text(d => MONTH_NAMES[d.month - 1])

    let monthIndices = [...MONTH_NAMES.keys()].map(m => m + 1)
    for (let month of monthIndices) {
        let commitsByDayOfMonthForThisMonth = DATASETS.COMMITS_BY_DAY_OF_MONTH_PER_MONTH.data[month]
        commitsByDayOfMonthForThisMonth.sort((d1, d2) => d3.ascending(d1.day, d2.day))

        let monthSum = commitsByDayOfMonthForThisMonth.reduce((acc, v) => acc + v.count, 0)

        let day = allMonths.append('g')
            .selectAll('rect')
            .data(commitsByDayOfMonthForThisMonth)
            .enter()

        let xx = d3.scaleBand()
            .domain(commitsByDayOfMonthForThisMonth.map(d => d.day))
            .range([0, x.bandwidth()])
            .paddingInner(0.1)

        let maxForThisMonth = d3.max(commitsByDayOfMonthForThisMonth, d => d.count)
        let y = d3.scaleLinear()
            .domain([0, maxForThisMonth]).nice()
            .range([baseY - 2, baseY - 150])

        day.append('rect')
            .attr('x', d => x(month) + xx(d.day))
            .attr('y', d => y(d.count))
            .attr('height', d => y(0) - y(d.count))
            .attr('width', xx.bandwidth())
            .attr('fill', getColor(monthSum))
            .attr('stroke-width', '0.1px')
            .attr('stroke', '#000')
            .attr('data-day', d => d.day)

    }

    return margin.bottom + x.bandwidth()
}

loadDatasets().then(() => {
    console.info('datasets loaded!')

    let svg = renderSvg()
    renderMonths(svg)
    renderTimesOfDay(svg)
}).catch(err => {
    console.error('error loading datasets: ', err)
})