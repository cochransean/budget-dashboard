require('d3');
require('./css/style.scss');
import { queue, json } from 'd3';
import BarChart from './components/bar-chart.js';



// load data
queue()
    .defer(json, 'data/portfolios.json')
    .defer(json, 'data/expert_consensus.json')
    .await(function(error, portfolios, consensus) {
        if (error) throw error;
        prepData(portfolios, consensus);
        let barChart = new BarChart('bar-chart', portfolios, consensus);
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

    for (let portfolio of consensus) {

        // Cast to numeric
        portfolio.proportion = +portfolio.proportion;
        for (let capability of portfolio.capabilities) {
            capability.proportion = +capability.proportion;

            // Track portfolio name
            capability.portfolio = portfolio.name;
        }
    }
}
// TODO: add mixing board to send current 'mix' of problem sets
