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

        // Calculate total value of each portfolio because the proportion data will need it
        portfolio.value = portfolio.capabilities.reduce((prev, current) => {

            // Cast to numeric while iterating anyway
            current.value = +current.value;

            return {value: prev.value + current.value}
        }).value;
    }

    for (let portfolio of consensus) {

        // Cast to numeric
        portfolio.proportion = +portfolio.proportion;
        for (let capability of portfolio.capabilities) {
            capability.proportion = +capability.proportion;
        }
    }
}
// TODO: add mixing board to send current 'mix' of problem sets
