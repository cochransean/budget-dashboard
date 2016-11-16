import * as d3 from "d3";
import { viewWidth, viewHeight, mobile } from '../index.js';

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
        let swatchWidth = viewWidth > mobile ? vis.height / 3: vis.height;
        swatchWidth = swatchWidth < vis.width ? swatchWidth: vis.width;

        ['swatch-value', 'swatch-consensus'].forEach(function(cssClass, index) {
            legendGroup.append('rect')
                .attr('x', () => vis.width / 2 * index)
                .attr('y', 0)
                .attr('width', swatchWidth)
                .attr('height', swatchWidth)
                .attr('class', cssClass);
        });

        // Add legend labels
        ['Actual Programmed', 'Expert Consensus'].forEach(function(text, index) {
            legendGroup.append('text')
                .attr('x', () => swatchWidth * 1.2 + vis.width / 2 * index)
                .attr('y', function() {
                    if (viewWidth > mobile) {
                        return swatchWidth / 2 + index * swatchWidth * 2
                    }
                    else {
                        return swatchWidth / 2
                    }
                })
                .attr('class', 'swatch-label')
                .text(text);
        });
    }

}

export default BarChartLegend;