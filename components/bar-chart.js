import * as d3 from "d3";

// SVG drawing area
class BarChart {

    constructor(parentDivID, portfolios, consensusA, consensusB) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.portfolios = portfolios;
        vis.consensusA = consensusA;
        vis.consensusB = consensusB;
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
        vis.margin = {top: vis.height * 0.2, right: vis.width * 0.1, bottom: vis.height * 0.1, left: vis.width * 0.1};
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
        vis.y = d3.scaleLinear()
            .range([0, vis.height]);
        vis.xAxis = d3.axisBottom(vis.x0);
        vis.yAxis = d3.axisLeft(vis.y);
        vis.xAxisGroup = vis.svg.append('g')
            .attr('transform', 'translate(0,' + vis.height + ')')
            .attr("class", "x-axis axis");
        vis.yAxisGroup = vis.svg.append('g')
            .attr("class", "y-axis axis");

        // Add blank rectangle behind everything to listen for clicks
        vis.svg.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('class', 'blank')
            .on('click', function() {
                vis.portfolioSelected = null;
                vis.wrangleData();
            });

        // TODO move legend to better place and toggle for "use actual portfolio value, user expert-recommended portfolio value"
        // Add legend
        ['swatch-value', 'swatch-consensus'].forEach(function(cssClass, index) {
            let swatchWidth = .02 * vis.width;
            vis.svg.append('rect')
                .attr('x', () => vis.width - vis.width * .2)
                .attr('y', () => -swatchWidth * 2.5 + index * swatchWidth )
                .attr('width', swatchWidth)
                .attr('height', swatchWidth)
                .attr('class', cssClass);
        });

        // Add legend labels
        ['Actual Programmed Value', 'Expert Consensus Value'].forEach(function(text, index) {
            let swatchWidth = .02 * vis.width;
            vis.svg.append('text')
                .attr('x', () => vis.width - vis.width *.2 + swatchWidth * 1.05)
                .attr('y', () => -swatchWidth * 2.5 + index * swatchWidth + swatchWidth / 1.6)
                .text(text);
        });

        vis.slider = d3.select('#slider');
        vis.slider.on('change', function() {
            vis.calcConsensus();
            vis.updateVis();
        });

        // Calculate the dollar value of expert consensus
        vis.calcConsensus();
    }

    wrangleData() {

        const vis = this;

        // Don't filter if no portfolio is selected
        if (vis.portfolioSelected === null) {

            // Combine all capabilities into one array
            let arraysToFlatten = [[], []];
            [vis.portfolios, vis.weightedConsensus].forEach(function(array, index) {
                array.forEach(function(portfolio) {
                    arraysToFlatten[index].push(portfolio.capabilities);
                });
            });

            vis.filteredPortfolios = [].concat.apply([], arraysToFlatten[0]);
            vis.filteredConsensus = [].concat.apply([], arraysToFlatten[1]);
        }

        // Otherwise, filter based on the selection
        else {
            console.log(vis.portfolioSelected);
            let nameToPosition = {
                'Portfolio 1': 0,
                'Portfolio 2': 1,
                'Portfolio 3': 2,
                'Portfolio 4': 3,
                'Portfolio 5': 4
            };
            let portfolioPosition = nameToPosition[vis.portfolioSelected];

            vis.filteredPortfolios = vis.portfolios[portfolioPosition].capabilities;
            vis.filteredConsensus = vis.weightedConsensus[portfolioPosition].capabilities;
        }

        vis.updateVis()
    }

    updateVis() {

        const vis = this;

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

        // Determine if highest value is in portfolios or consensus to setup axes
        let maxPortfolio = vis.portfolioSelected === null ? d3.max(vis.portfolios, d => d.value):
            d3.max(vis.filteredPortfolios, d => d.value);
        let maxConsensus = vis.portfolioSelected === null ? d3.max(vis.weightedConsensus, d => d.value):
            d3.max(vis.filteredConsensus, d => d.value);
        let maxYValue = d3.max([maxPortfolio, maxConsensus]);
        console.log(maxYValue);

        // Update y-axis
        vis.y.domain([maxYValue, 0]);

        // Update x-axis
        let names = vis.portfolioSelected === null ? vis.portfolios.map(value => value.name) :
            vis.filteredPortfolios.map(value => value.name);
        vis.x0.domain(names);

        // Cumulatively track position for building bars
        let cumulativeActual = {};
        let cumulativeConsensus = {};
        let indexLookup = vis.portfolioSelected === null ? 'portfolio': 'name';

        // Track current Y position for each bar
        names.forEach(function(name) {
            cumulativeActual[name] = 0;
            cumulativeConsensus[name] = 0;
        });

        actualValueBars.exit()
            .remove();

        actualValueBars.enter()
            .append('rect')
            .on("click", function(d) {
                vis.portfolioSelected = d.portfolio;
                vis.wrangleData();
            })
            .merge(actualValueBars)
            .style("opacity", 0.5)
            .transition()
            .duration(800)
            .attr('x', function(d) {
                if (vis.portfolioSelected === null) {
                    return vis.x0(d.portfolio)
                }
                else {
                    return vis.x0(d.name)
                }
            })
            .attr('y', function(d) {
                let current = vis.height - vis.y(d.value);
                let position =  vis.height - cumulativeActual[d[indexLookup]] - current;
                cumulativeActual[d.portfolio] += current;
                return position
            })
            .attr('height', d => vis.height - vis.y(d.value))
            .attr('width', d => vis.x0.bandwidth() / 2)
            .attr('class', 'bar-value')
            .style("opacity", 1);

        consensusBars.exit()
            .remove();

        consensusBars.enter()
            .append('rect')
            .on("click", function(d) {
                vis.portfolioSelected = d.portfolio;
                vis.wrangleData();
            })
            .merge(consensusBars)
            .style("opacity", 0.5)
            .transition()
            .duration(800)
            .attr('x', function(d) {
                if (vis.portfolioSelected === null) {
                    return vis.x0(d.portfolio) + vis.x0.bandwidth() / 2
                }
                else {
                    return vis.x0(d.name) + vis.x0.bandwidth() / 2
                }
            })
            .attr('y', function(d) {
                let current = vis.height - vis.y(d.value);
                let position =  vis.height - cumulativeConsensus[d[indexLookup]] - current;
                cumulativeConsensus[d.portfolio] += current;
                return position
            })
            .attr('height', d => vis.height - vis.y(d.value))
            .attr('width', d => vis.x0.bandwidth() / 2)
            .attr('class', 'bar-consensus')
            .style("opacity", 1);

        // update axes
        vis.xAxisGroup
            .transition()
            .duration(800)
            .call(vis.xAxis);
        vis.yAxisGroup
            .transition()
            .duration(800)
            .call(vis.yAxis);

    }

    calcConsensus() {

        const vis = this;

        let sliderValue = vis.slider.node().value;
        let consensusAWeight = 1 - sliderValue / 100;
        let consensusBWeight = 1 - consensusAWeight;

        // Make object to store weighted values in without corrupting original data
        vis.weightedConsensus = [];

        // Calculate the dollar value of expert consensus
        // This function should only be called on init and when sliders change
        for (let i = 0; i < vis.consensusA.length; i++) {
            vis.weightedConsensus.push({
                'name': vis.consensusA[i].name,
                'capabilities': []
            });
            vis.weightedConsensus[i].value = consensusAWeight * vis.consensusA[i].value +
                    consensusBWeight * vis.consensusB[i].value;
            for (let j = 0; j < vis.consensusA[i].capabilities.length; j++) {
                vis.weightedConsensus[i].capabilities.push({
                    'name': vis.consensusA[i].capabilities[j].name,
                    'portfolio': vis.consensusA[i].name
                });
                vis.weightedConsensus[i].capabilities[j].value =
                    consensusAWeight * vis.consensusA[i].capabilities[j].value +
                    consensusBWeight * vis.consensusB[i].capabilities[j].value;
            }
        }
        vis.wrangleData();
    }
}

export default BarChart;