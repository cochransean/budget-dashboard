import * as d3 from "d3";
import stateBank from './state.js';
import dispatcher from './dispatch.js';
import { viewWidth, mobile } from '../index.js';
import { wrapAxis } from '../js/helpers';

class Mixer {

    constructor(parentDivID) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.sliderLabels = stateBank.getSliderNames();
        vis.initVis();
    }

    initVis() {
        const vis = this;

        // Append svg
        // Setup margins in responsive way; actual size is determined by CSS
        let chartDiv = d3.select(vis.parentDivID);
        let chartDivRect = chartDiv.node().getBoundingClientRect();

        // Responsively setup margins
        if (viewWidth > mobile) {
            vis.margin = {
                top: chartDivRect.height * 0.25,
                right: chartDivRect.width * 0.14,
                bottom: chartDivRect.height * 0.2,
                left: 0
            };
        }

        else {
            vis.margin = {
                top: 20,
                right: chartDivRect.width * 0.25,
                bottom: 37,
                left: 15
            };
        }

        vis.width = chartDivRect.width - vis.margin.left - vis.margin.right;
        vis.height = chartDivRect.height - vis.margin.top - vis.margin.bottom;

        vis.svg = chartDiv.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Add Heading
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", -vis.margin.top / 2)
            .attr("class", "axis-label")
            .text(' "The Mixing Board" ');

        // Setup scales
        vis.x = d3.scaleBand()
            .domain(vis.sliderLabels)
            .paddingInner([0])
            .rangeRound([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.height, 0])
            .clamp(true);

        // Add explanatory lines and labels for the sliders themselves
        vis.svg.append("line")
            .attr("class", "slider-guide")
            .attr("x1", vis.x(vis.sliderLabels[0]) + vis.x.bandwidth() / 3)
            .attr("x2", vis.x(vis.sliderLabels[vis.sliderLabels.length - 1]) + vis.x.bandwidth() / 3)
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y1", vis.height)
            .attr("y2", vis.height);

        // This needs to be done here (and not with margins above) because the x-axis doesn't exist until
        // the margins have been created, necessitating the additional conditional check.
        const sliderTextPadding = viewWidth > mobile ? vis.x.bandwidth() * 0.05: vis.x.bandwidth() * 0.12;

        let labelDimensions = vis.svg.append("text")
            .attr("y", vis.height)
            .attr("x", vis.x(vis.sliderLabels[0]) - sliderTextPadding + vis.x.bandwidth() / 3)
            .text("0%")
            .attr("class", "slider-guide-text")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y", 0)
            .text("100%")
            .node().getBBox(); // Get width for displaying outline rectangle on handle labels

        // Add sliders
        vis.sliderLabels.forEach(function(label, index) {

            // Append group for each
            let slider = vis.svg.append("g")
                .attr("class", "slider")
                .attr("transform", "translate(" + (vis.x(label) + vis.x.bandwidth() / 3) + ", 0)");

            slider.append("line")
                .attr("class", "track")
                .attr("y1", 0)
                .attr("y2", vis.height)
                .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-inset")
                .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-overlay")
                .call(d3.drag()
                    .on("start.interrupt", function() { slider.interrupt(); })
                    .on("start drag", function() {
                        sliderDrag(vis.y.invert(d3.event.y), label, handle, handleLabel, handleText);
                    })
                    .on("end", function() { sliderEnd(); })
                );

            let actualSetting = slider.insert("line", ".track-overlay")
                .attr("class", "track-actual-setting")
                .attr("y1", vis.y(stateBank.getSlider(label)))
                .attr("y2", vis.height);

            let eventName = "ratio-updated.slider" + index; // Create unique event name to prevent name space issues.
            dispatcher
                .on(eventName, function() {

                    // Update the actual position indicators if the input was valid and vis updated
                    actualSetting
                        .transition()
                        .duration(800)
                        .attr("y1", vis.y(stateBank.getSlider(label)))
                        .attr("y2", vis.height);
                });

            let radius;
            if (viewWidth > mobile) {
                radius = 0.013 * vis.width
            }
            else {
                radius = 0.03 * vis.width
            }

            slider.append("text")
                .attr("class", "slider-label")
                .attr("transform", () =>  "translate(0," + (vis.height + radius + 15) + ")")
                .text(label);

            let handle = slider.insert("circle", ".track-overlay")
                .attr("class", "handle")
                .attr("r", radius)
                .attr("cy", vis.y(stateBank.getSlider(label)));

            let handleLabel = slider.insert("g", ".track-overlay")
                .attr("transform", "translate(" + sliderTextPadding + "," + vis.y(stateBank.getSlider(label)) + ")");

            // Setup handles responsively
            handleLabel.append("rect")
                .attr("height", labelDimensions.height * 1.1) // Use pre-determined width and height from y-axis label
                .attr("width", labelDimensions.width * 1.1)
                .attr("y", -(labelDimensions.height * 1.1 / 2))
                .attr("class", "handle-label");

            const handleTextPadding = vis.x.bandwidth() * 0.01;
            let handleText = handleLabel.append("text")
                .attr("class", "slider-percentage")
                .attr("x", handleTextPadding)
                .text(function() { return stateBank.getSlider(label) + "%" });

        });

        vis.svg.selectAll(".slider-label")
            .call(wrapAxis, vis.x.bandwidth());

        // Add the total percentage widget
        // Different scale to show when user has selected over 100
        vis.y1 = d3.scaleLinear()
            .domain([0, 200])
            .range([vis.height, 0])
            .clamp(true);

        // Constants that will be reused
        const textWidth = viewWidth > mobile ? 70 :53;
        const totalPercentageWidth = vis.margin.right - textWidth;
        const totalStartX = vis.width;
        const totalLabelX = totalStartX + totalPercentageWidth + 5; // Add padding for labels

        // Add total bar itself
        vis.totalBar = vis.svg.append("rect")
            .attr("x", totalStartX)
            .attr("class", "total-outline")
            .attr("height", vis.height)
            .attr("width", totalPercentageWidth)
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("height", 0)
            .attr("class", "total-bar-good");

        // Add axis guide line and labels
        vis.svg.append("line")
            .attr("x1", totalStartX)
            .attr("x2", totalStartX + totalPercentageWidth)
            .attr("class", "total-guide")
            .attr("y1", vis.height / 2)
            .attr("y2", vis.height / 2);

        vis.hundredLabel = vis.svg.append("text")
            .attr("x", totalLabelX)
            .attr("class", "total-guide-text")
            .attr("font-size", function() {

                // Set size here instead of CSS to support animation.
                if (viewWidth > mobile) {
                    return ".83vmax"
                }
                else {
                    return "1.8vmax"
                }
            })
            .text("200%+")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y", vis.height)
            .text("0%")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y", vis.height / 2)
            .text("100%");

        //  Add 'Total' Text Label in bold at bottom
        vis.svg.append("text")
            .attr('transform', function() {
                return "translate(" + (totalStartX + totalPercentageWidth / 2) + "," + (vis.height + 17) + ")"

            })
            .attr("class", "total-label-text")
            .text("Total");


        vis.updateVis();



        // Respond to slider drags
        function sliderDrag(value, sliderID, handle, handleLabel, handleText) {

            // Round to avoid floating point errors where total !== 100
            value = Math.round(value);

            // Update the slider state
            stateBank.setSlider(sliderID, value);

            // Ensure that on lower screen sizes the returned values still always allow total percentage to === 100
            // since there is something not enough precision; Make handle "snap" when close to 100
            let delta = 100 - stateBank.sliderTotal;
            if (Math.abs(delta) <= 3) {
                value = value + delta;
                stateBank.setSlider(sliderID, value);
            }

            // Move the UI SVG pieces
            handle.attr("cy", vis.y(value));
            handleLabel.attr("transform", "translate(" + sliderTextPadding + "," + vis.y(value) + ")");

            // Update the text
            handleText.text(value + "%");

            // Update the total percentage widget
            vis.updateVis()
        }

        // Respond to slider end
        function sliderEnd() {

            // Check if input is valid (adds up to 100%)
            if (stateBank.sliderTotal === 100) {

                // Trigger update of bar graphs
                dispatcher.call('ratio-updated');

            }
        }
    }

    updateVis() {
        let vis = this;

        // Update length of the total bar
        vis.totalBar
            .attr("y", vis.y1(stateBank.sliderTotal))
            .attr("height", vis.height - vis.y1(stateBank.sliderTotal))
            .attr("class", function() {
                return stateBank.sliderTotal === 100 ? 'total-bar-good': 'total-bar-bad'
            });

        // Animate the 100% label to cue user that proper input has been received. Animate even if 100 was skipped
        // as in a rapid slider movement.
        if (stateBank.sliderTotal === 100 || (vis.prevTotal > 100 && stateBank.sliderTotal < 100) ||
            (vis.prevTotal < 100 && stateBank.sliderTotal > 100)) {
            vis.hundredLabel
                .transition()
                .duration(250)
                .ease(d3.easeLinear)
                .attr("font-size", function() {
                    if (viewWidth > mobile) {
                        return "1.5vmax"
                    }
                    else {
                        return "3.5vmax"
                    }
                })
                .transition()
                .delay(0)
                .duration(250)
                .ease(d3.easeLinear)
                .attr("font-size", function() {
                    if (viewWidth > mobile) {
                        return ".83vmax"
                    }
                    else {
                        return "1.8vmax"
                    }
                });
        }

        // Track the previous total so that you can animate even if 100% was skipped over as happens with rapid
        // slider movement
        vis.prevTotal = stateBank.sliderTotal;

    }

    removeVis() {
        let vis = this;
        d3.select(vis.parentDivID).select("svg").remove();
    }

}

export default Mixer;