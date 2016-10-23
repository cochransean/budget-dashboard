import * as d3 from "d3";

// SVG drawing area
class BarChart {

    constructor(parentDivID, portfolios, consensus) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.portfolios = portfolios;
        vis.consensus = consensus;
        vis.portfolioSelected = null;
        vis.initVis();
    }

    initVis() {
        const vis = this;

        // Setup margins in responsive way; actual size is determined by CSS
        let chartDiv = d3.select(vis.parentDivID);
        let chartDivRect = chartDiv.node().getBoundingClientRect();
        vis.width = chartDivRect.width;
        vis.height = chartDivRect.height;
        vis.margin = {top: vis.height * 0.1, right: vis.width * 0.1, bottom: vis.height * 0.1, left: vis.width * 0.1};
        vis.width = vis.width - vis.margin.left - vis.margin.right;
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

        vis.svg = chartDiv.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x0 = d3.scaleBand()
            .paddingInner([0.2])
            .rangeRound([0, vis.width]);
        vis.x1 = d3.scaleBand();
        vis.y = d3.scaleLinear()
            .range([0, vis.height]);
        vis.xAxis = d3.axisBottom(vis.x0);
        vis.yAxis = d3.axisLeft(vis.y);
        vis.xAxisGroup = vis.svg.append('g')
            .attr('transform', 'translate(0,' + vis.height + ')');
        vis.yAxisGroup = vis.svg.append('g');

        // Calculate the dollar value of expert consensus
        vis.calcConsensus();
        vis.wrangleData();
    }

    wrangleData() {

        const vis = this;

        // Don't filter if no portfolio is selected
        if (vis.portfolioSelected === null) {

            // Combine all capabilities into one array
            let arraysToFlatten = [[], []];
            [vis.portfolios, vis.consensus].forEach(function(array, index) {
                array.forEach(function(portfolio) {
                    arraysToFlatten[index].push(portfolio.capabilities);
                });
            });

            vis.filteredPortfolios = [].concat.apply([], arraysToFlatten[0]);
            vis.filteredConsensus = [].concat.apply([], arraysToFlatten[1]);
        }

        // Otherwise, filter based on the selection
        else {
            vis.filteredPortfolios = vis.portfolios[vis.portfolioSelected];
            vis.filteredConsensus = vis.consensus[vis.portfolioSelected];
        }

        vis.updateVis()
    }

    updateVis() {

        const vis = this;

        // Determine if highest value is in portfolios or consensus to setup axes
        let maxPortfolio = d3.max(vis.portfolios, d => d.value);
        let maxConsensus = d3.max(vis.consensus, d => d.value);
        let maxYValue = d3.max([maxPortfolio, maxConsensus]);

        // Update axes
        vis.x1.domain(['Programmed Value', 'Expert-Assessed Value']).rangeRound([0, vis.x0.bandwidth()]);
        vis.y.domain([0, maxYValue]);

        // Select data; will always be selected based on capability name since bars are stacked capes even in portfolio
        // view.
        let actualValueBars = vis.svg.selectAll('.bar-value')
            .data(vis.filteredPortfolios, function(d) {
                return d.name;
            });
        let consensusBars = vis.svg.selectAll('.bar-consensus')
            .data(vis.filteredConsensus, function(d) {
                return d.name;
            });

        if (vis.portfolioSelected === null) {

            let cumulativeActual = {};
            let cumulativeConsensus = {};

            // Update axis with portfolio names
            let portfolioNames = vis.portfolios.map(value => value.name);

            // Track current Y position for each bar
            portfolioNames.forEach(function(name) {
                cumulativeActual[name] = 0;
                cumulativeConsensus[name] = 0;
            });
            vis.x0.domain(portfolioNames);

            actualValueBars.enter().append('rect')
                .merge(actualValueBars)
                .attr('x', d => vis.x0(d.portfolio))
                .attr('y', function(d) {
                    let current = vis.y(d.value);
                    let position =  vis.height - cumulativeActual[d.portfolio] - current;
                    cumulativeActual[d.portfolio] += current;
                    return position
                })
                .attr('height', d => vis.y(d.value))
                .attr('width', d => vis.x0.bandwidth() / 2)
                .attr('class', 'bar-value');

            consensusBars.enter().append('rect')
                .merge(consensusBars)
                .attr('x', d => vis.x0(d.portfolio) + vis.x0.bandwidth() / 2)
                .attr('y', function(d) {
                    let current = vis.y(d.value);
                    let position =  vis.height - cumulativeConsensus[d.portfolio] - current;
                    cumulativeConsensus[d.portfolio] += current;
                    return position
                })
                .attr('height', d => vis.y(d.value))
                .attr('width', d => vis.x0.bandwidth() / 2)
                .attr('class', 'bar-consensus');
        }

    }

    calcConsensus() {

        const vis = this;

        // Get total value of all actual portfolios and calculate what each should have based on consensus
        let totalActual = vis.portfolios.reduce((prev, current) => {
            return {value: prev.value + current.value}
        }).value;

        // Calculate the dollar value of expert consensus
        // TODO average expert consensus based on where the slider is once implemented
        // TODO this function should only be called on init and when sliders change
        for (let i = 0; i < vis.consensus.length; i++) {
            vis.consensus[i].value = vis.consensus[i].proportion * totalActual;
            for (let j = 0; j < vis.consensus[i].capabilities.length; j++) {
                vis.consensus[i].capabilities[j].value = vis.consensus[i].capabilities[j].proportion *
                    vis.consensus[i].value;
            }
        }
    }
}

export default BarChart;