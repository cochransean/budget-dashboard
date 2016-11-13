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
        vis.margin = {
            top: chartDivRect.height * 0.1,
            right: chartDivRect.width * 0.1,
            bottom: chartDivRect.height * 0.1,
            left: chartDivRect.width * 0.1
        };
        vis.width = chartDivRect.width - vis.margin.left - vis.margin.right;
        vis.height = chartDivRect.height - vis.margin.top - vis.margin.bottom;

        vis.svg = chartDiv.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Add legend
        let legendGroup = vis.svg.append('g');
        let swatchWidth = vis.height / 3;

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
                .attr('x', function() {
                    if (vis.width >= vis.height) {
                        return swatchWidth * 1.2
                    }
                    else {
                        return 0
                    }
                })
                .attr('y', function() {
                    if (vis.width >= vis.height) {
                        return swatchWidth / 1.6 + index * swatchWidth * 2
                    }
                    else {
                        const verticalPadding = 8;
                        return ((index * 2 + 1) * swatchWidth) + verticalPadding;
                    }
                })
                .text(text);
        });
    }

}

export default BarChartLegend;