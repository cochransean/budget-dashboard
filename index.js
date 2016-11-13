require('babel-polyfill');
require('d3');
require('./css/style.scss');
import { queue, json, keys } from 'd3';
import BarChart from './components/bar-chart.js';
import BarChartLegend from './components/bar-chart-legend.js';
import Mixer from './components/mixer.js';


// load data
queue()
    .defer(json, 'data/portfolios.json')
    .defer(json, 'data/expert_consensus_alien.json')
    .defer(json, 'data/expert_consensus_zombie.json')
    .defer(json, 'data/expert_consensus_mutant.json')
    .await(function(error, portfolios, consensusA, consensusB, consensusC) {
        if (error) throw error;
        let consensus =  {
            "Alien Invasion": consensusA,
            "Zombie Apocalypse": consensusB,
            "Mutant Super-Villain": consensusC
        };
        prepData(portfolios, consensus);
        let barChart = new BarChart('bar-chart', portfolios, consensus);
        let barChartLegend = new BarChartLegend('bar-chart-legend');
        let mixer = new Mixer('mixer');

        // TODO: reload visualizations after window resizing

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

// TODO: add mixing board to send current 'mix' of problem sets

