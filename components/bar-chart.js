import * as d3 from "d3";
import stateBank from './state.js';
import dispatcher from './dispatch.js';
import { viewWidth, mobile } from '../index.js';
import { wrapAxis } from '../js/helpers';

// SVG drawing area
class BarChart {

    constructor(parentDivID, portfolios, consensusArray) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.portfolios = portfolios;
        vis.consensus = consensusArray;
        vis.portfolioSelected = null;
        vis.initVis();

        // Populate a dictionary converting from string name to array index so that you don't have to iterate
        // through the entire array each time you're searching for a name
        vis.nameToPosition = {};
        vis.portfolios.forEach(function(portfolio, index) {
            vis.nameToPosition[portfolio.name] = index;
        });

        // Trigger updates when new ratios are selected using sliders
        dispatcher.on('ratio-updated.bar', () => vis.calcConsensus.call(vis) );
    }

    initVis() {
        const vis = this;

        // Setup margins in responsive way; actual size is determined by CSS
        let chartDiv = d3.select(vis.parentDivID);
        vis.chartDivRect = chartDiv.node().getBoundingClientRect();
        if (viewWidth > mobile) {
            vis.margin = {
                top: vis.chartDivRect.height * 0.025,
                right: vis.chartDivRect.width * 0.1,
                bottom: vis.chartDivRect.height * 0.1,
                left: vis.chartDivRect.width * 0.1
            };
        }
        else {
            vis.margin = {
                top: vis.chartDivRect.height * 0.025,
                right: 50,
                bottom: vis.chartDivRect.height * 0.26,
                left: 57
            };
        }

        vis.width = vis.chartDivRect.width - vis.margin.left - vis.margin.right;
        vis.height = vis.chartDivRect.height - vis.margin.top - vis.margin.bottom;

        vis.svg = chartDiv.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Add blank rectangle behind everything to listen for clicks
        vis.svg.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('class', 'blank')
            .on('click', function() {
                vis.portfolioSelected = null;
                vis.wrangleData();
            });

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

        vis.xAxisText = vis.svg.append('text')
            .attr('x', () => vis.width / 2)
            .attr('class', 'axis-label');

        let yLabelOffset = viewWidth > mobile ? vis.width * -0.038: -55;
        vis.svg.append('text')
            .attr("transform", "translate(" + yLabelOffset + "," + vis.height / 2 + ") rotate(90)")
            .attr('class', 'axis-label')
            .text('Value (Billions)');


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

            let portfolioPosition = vis.nameToPosition[vis.portfolioSelected];

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

        // Variables to setting up axes
        let maxPortfolio, maxConsensus, names, indexLookup;

        // If a portfolio is not currently selected
        if (vis.portfolioSelected === null) {

            // Determine max for each y-axis category
            maxPortfolio = d3.max(vis.portfolios, d => d.value);
            maxConsensus = d3.max(vis.weightedConsensus, d => d.value);

            // Get names for x-axis
            names = vis.portfolios.map(value => value.name);

            // Use the portfolio name to lookup data
            indexLookup = 'portfolio';
        }

        // Otherwise, the user must be zoomed in on a particular portfolio
        else {

            // Determine max for each y-axis category
            maxPortfolio = d3.max(vis.filteredPortfolios, d => d.value);
            maxConsensus = d3.max(vis.filteredConsensus, d => d.value);

            // Get names for x-axis
            names = vis.filteredPortfolios.map(value => value.name);

            // Use capability name to lookup data
            indexLookup = 'name';
        }

        // Determine if highest value is in portfolios or consensus
        let maxYValue = d3.max([maxPortfolio, maxConsensus]);

        // Update y-axis
        vis.y.domain([maxYValue, 0]);

        // Update x-axis
        vis.x0.domain(names);

        // Cumulatively track position for building bars
        let cumulativeActual = {};
        let cumulativeConsensus = {};

        // Track current Y position for each bar
        names.forEach(function(name) {
            cumulativeActual[name] = 0;
            cumulativeConsensus[name] = 0;
        });

        actualValueBars.exit()
            .remove();

        actualValueBars.enter()
            .append('rect')
            .on("click", barClickResponse)
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
            .on("click", barClickResponse)
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
        vis.xAxisLabels = vis.xAxisGroup
            .call(vis.xAxis)
            .selectAll('.x-axis text');
        vis.xAxisLabels
            .attr("transform", function() { return "translate(0, 15)" })
            .call(wrapAxis, vis.x0.bandwidth()); // Wrap text
        vis.yAxisGroup
            .transition()
            .duration(800)
            .call(vis.yAxis);
        vis.xAxisText
            .attr('y', function() {

                // Filter to the X axis labels that are over the top of the label
                let labels = vis.xAxisLabels.filter(function(d, i) {
                    if (i === 2 || i === 3 || i === 4) {
                        return this
                    }
                    else {
                        return null
                    }
                });

                // Find the lowest label
                let lowLabelY = 0;
                labels.each(function() {
                    let currentBottom = this.getBoundingClientRect().bottom;
                    if (currentBottom >= lowLabelY) {
                        lowLabelY = currentBottom;
                    }
                });

                // Convert to relative coordinates and add padding
                const padding = viewWidth > mobile ? 5: 2;
                return lowLabelY - vis.chartDivRect.top + padding;
            })
            .text(() => vis.portfolioSelected === null ? 'Portfolios': 'Capabilities');

        function barClickResponse(d) {

            // If zoomed all the way out to portfolio level view
            if (vis.portfolioSelected === null) {
                vis.portfolioSelected = d.portfolio;
            }

            // If zoomed in to capability level view
            else {
                vis.portfolioSelected = null;
            }

            // Update the vis
            vis.wrangleData();
        }

    }

    calcConsensus() {

        // Calculate the dollar value of expert consensus
        // This function should only be called on init and when sliders change
        const vis = this;

        // Store weighted values without corrupting original data
        vis.weightedConsensus = [];

        // Loop over each portfolio, calculating weighted value of each
        for (let i = 0; i < vis.portfolios.length; i++) {

            vis.weightedConsensus.push({
                'name': vis.portfolios[i].name,
                'capabilities': []
            });

            // Calculate the total weighted value of each portfolio
            vis.weightedConsensus[i].value = 0;
            d3.keys(vis.consensus).forEach(function(consensusScenario) {

                // Index to the proper portfolio within current scenario and get unweighted value
                let currentValue = vis.consensus[consensusScenario][i].value;

                // Weight the value by applying the slider values
                let currentWeight = stateBank.getSlider(consensusScenario) / 100;

                // Add the weighted values up to get an "expected value";
                vis.weightedConsensus[i].value += currentValue * currentWeight
            });

            // Calculate the total weighted value of each capability
            for (let j = 0; j < vis.portfolios[i].capabilities.length; j++) {

                // Add an object for each capability
                vis.weightedConsensus[i].capabilities.push({
                    'name': vis.portfolios[i].capabilities[j].name,
                    'portfolio': vis.portfolios[i].name // Need to track this so that capabilities can 'stack'
                });

                let capabilityWeightedValue = 0;
                d3.keys(vis.consensus).forEach(function(consensusScenario) {

                    // Index to the proper portfolio within current scenario and get unweighted value
                    let currentValue = vis.consensus[consensusScenario][i].capabilities[j].value;

                    // Weight the value by applying the slider values
                    let currentWeight = stateBank.getSlider(consensusScenario) / 100;

                    // Add the weighted values up to get an "expected value";
                    capabilityWeightedValue += currentValue * currentWeight
                });

                // Update the total
                vis.weightedConsensus[i].capabilities[j].value = capabilityWeightedValue;
            }
        }

        vis.wrangleData();
    }
}

export default BarChart;