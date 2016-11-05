import * as d3 from "d3";

class BarChartLegend {

    constructor(parentDivID) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.initVis();
    }

    initVis() {
        const vis = this;

        // Append svg
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

        // Add legend
        let legendGroup = vis.svg.append('g');
        let swatchWidth = .1 * vis.width;

        ['swatch-value', 'swatch-consensus'].forEach(function(cssClass, index) {
            legendGroup.append('rect')
                .attr('x', 0)
                .attr('y', () => index * swatchWidth * 2 )
                .attr('width', swatchWidth)
                .attr('height', swatchWidth)
                .attr('class', cssClass);
        });

        // Add legend labels
        ['Actual Programmed', 'Expert Consensus'].forEach(function(text, index) {
            legendGroup.append('text')
                .attr('x', () => swatchWidth * 1.2)
                .attr('y', () => (swatchWidth / 1.6) + (index * swatchWidth * 2))
                .text(text);
        });
    }

}

export default BarChartLegend;