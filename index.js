require('babel-polyfill');
require('d3');
require('./css/style.scss');
import { queue, json } from 'd3';
import BarChart from './components/bar-chart.js';
import BarChartLegend from './components/bar-chart-legend.js';



// load data
queue()
    .defer(json, 'data/portfolios.json')
    .defer(json, 'data/expert_consensus.json')
    .defer(json, 'data/expert_consensusB.json')
    .await(function(error, portfolios, consensusA, consensusB) {
        if (error) throw error;
        prepData(portfolios, consensusA, consensusB);
        let barChart = new BarChart('bar-chart', portfolios, consensusA, consensusB);
        let barChartLegend = new BarChartLegend('bar-chart-legend');
    });

function prepData(portfolios, consensusA, consensusB) {

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

    [consensusA, consensusB].forEach(function(consensusOpinion) {
        for (let portfolio of consensusOpinion) {

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
