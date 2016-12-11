require('babel-polyfill');
require('d3');
require('./css/style.scss');
import { queue, json, keys, selectAll } from 'd3';
import BarChart from './components/bar-chart.js';
import BarChartLegend from './components/bar-chart-legend.js';
import Mixer from './components/mixer.js';

// Breakpoints
const mobile = 991;

// D3 Visualizations
let barChart;
let mixer;
let barChartLegend;

// Data
let portfolios;
let consensus;

// Variables for viewport sizing
let viewWidth;
let viewHeight;

// load data
queue()
    .defer(json, 'data/portfolios.json')
    .defer(json, 'data/expert_consensus_alien.json')
    .defer(json, 'data/expert_consensus_zombie.json')
    .defer(json, 'data/expert_consensus_mutant.json')
    .await(function(error, portfoliosData, consensusA, consensusB, consensusC) {
        if (error) throw error;

        // Format and prepare the data
        portfolios = portfoliosData;
        consensus =  {
            "Alien Invasion": consensusA,
            "Zombie Apocalypse": consensusB,
            "Mutant Super-Villain": consensusC
        };
        prepData(portfolios, consensus);
        createVisualizations();

        let resizeTimer;
        window.onresize = function(){
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resetVisualizations, 100);
        };
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

function createVisualizations() {

    viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Create the visualizations
    barChart = new BarChart('bar-chart', portfolios, consensus);
    mixer = new Mixer('mixer');
    barChartLegend = new BarChartLegend('bar-chart-legend');
}

function resetVisualizations() {

    // Remove old visualizations
    let removePromise = new Promise(function(resolve) {

        // Remove the old elements
        let oldElements = selectAll("svg");

        // Check for all old elements preventing multiple firings with
        // leftover elements or when elements have been removed but not yet re-added
        if (oldElements.size() === 3) {
            oldElements.remove();
            resolve('All items deleted');
        }
    });

    removePromise.then(function() {

        // Update dimensions
        viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        barChart.initVis();
        mixer.initVis();
        barChartLegend.initVis();
    });
}

export { mobile, viewWidth, viewHeight }

