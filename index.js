require('babel-polyfill');
require('d3');
require('./css/style.scss');
import { queue, json, keys } from 'd3';
import BarChart from './components/bar-chart.js';
import BarChartLegend from './components/bar-chart-legend.js';
import Mixer from './components/mixer.js';

// Breakpoints
const mobile = 991;


// Get viewport sizing
let viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

// load data
queue()
    .defer(json, 'data/portfolios.json')
    .defer(json, 'data/expert_consensus_alien.json')
    .defer(json, 'data/expert_consensus_zombie.json')
    .defer(json, 'data/expert_consensus_mutant.json')
    .await(function(error, portfolios, consensusA, consensusB, consensusC) {
        if (error) throw error;

        // Format and prepare the data
        let consensus =  {
            "Alien Invasion": consensusA,
            "Zombie Apocalypse": consensusB,
            "Mutant Super-Villain": consensusC
        };
        prepData(portfolios, consensus);

        // Create the visualizations
        let barChart = new BarChart('bar-chart', portfolios, consensus);
        let mixer = new Mixer('mixer');
        if (viewWidth > mobile) {
            let barChartLegend = new BarChartLegend('bar-chart-legend');
        }

        // Make more optimal use of space on mobile devices
        else {
            let barChartLegend = new BarChartLegend('bar-chart-legend-xs');
        }
    });

function prepData(portfolios, consensus) {

    for (let portfolio of portfolios) {

        // Clean up data
        portfolio.capabilities.forEach(function(capability){

            // Cast to numeric while iterating anyway
            capability.value = +capability.value;

            // Track portfolio name
            capability.portfolio = portfolio.name;
        });

        // Calculate total value of each portfolio because the proportion data will need it
        portfolio.value = portfolio.capabilities.reduce((prev, current) => {
            return {value: prev.value + current.value}
        }).value;
    }

    // Get total value of all actual portfolios and calculate what each should have based on consensus
    let totalActual = portfolios.reduce((prev, current) => {
        return {value: prev.value + current.value}
    }).value;

    keys(consensus).forEach(function(consensusScenario) {
        for (let portfolio of consensus[consensusScenario]) {

            // Cast to numeric
            portfolio.proportion = +portfolio.proportion;

            // Determine what the experts think this portfolio should be worth
            portfolio.value = portfolio.proportion * totalActual;

            for (let capability of portfolio.capabilities) {
                capability.proportion = +capability.proportion;
                capability.value = portfolio.value * capability.proportion;

                // Track portfolio name
                capability.portfolio = portfolio.name;
            }
        }
    });
}

export { mobile, viewWidth, viewHeight }

