import * as d3 from "d3";

class Mixer {

    constructor(parentDivID) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.sliderLabels = ['Alien Invasion', 'Zombie Apocalypse', 'Mutant Super-Villain'];
        vis.initialPositions = {
            'Alien Invasion': 100,
            'Zombie Apocalypse': 0,
            'Mutant Super-Villain': 0
        };
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
        vis.margin = {top: vis.height * 0.25, right: vis.width * 0.05, bottom: vis.height * 0.2, left: vis.width * 0.05};
        vis.width = vis.width - vis.margin.left - vis.margin.right;
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

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
            .domain(vis.sliderLabels.concat(['Total'])) // Leave a spot for the total percentage widget
            .paddingInner([0.2])
            .rangeRound([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.height, 0])
            .clamp(true);

        // Add explanatory lines and labels for the sliders themselves
        vis.svg.append("line")
            .attr("class", "slider-guide")
            .attr("x1", vis.x(vis.sliderLabels[0]) + vis.x.bandwidth() / 2)
            .attr("x2", vis.x(vis.sliderLabels[vis.sliderLabels.length - 1]) + vis.x.bandwidth() / 2)
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y1", vis.height)
            .attr("y2", vis.height);

        const sliderTextPadding = vis.x.bandwidth() * 0.05;

        vis.svg.append("text")
            .attr("class", "slider-guide-text")
            .attr("x", vis.x(vis.sliderLabels[0]) - sliderTextPadding + vis.x.bandwidth() / 2)
            .text("100%")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("y", vis.height)
            .text("0%");


        // Add sliders
        vis.sliderLabels.forEach(function(label) {

            // Append group for each
            let slider = vis.svg.append("g")
                .attr("class", "slider")
                .attr("transform", "translate(" + (vis.x(label) + vis.x.bandwidth() / 2) + ", 0)");

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
                        sliderDrag(vis.y.invert(d3.event.y), handle, handleLabel, handleText);
                    }));

            slider.append("text")
                .attr("y", vis.height * 1.25)
                .attr("class", "slider-label")
                .text(label);

            let handle = slider.insert("circle", ".track-overlay")
                .attr("class", "handle")
                .attr("r", 9)
                .attr("cy", vis.y(vis.initialPositions[label]));

            let handleLabel = slider.insert("g", ".track-overlay")
                .attr("transform", "translate(" + sliderTextPadding + "," + vis.y(vis.initialPositions[label]) + ")");

            const handleLabelHeight = vis.height * 0.25;
            const handleLabelWidth = vis.x.bandwidth() * 0.2;
            handleLabel.append("rect")
                .attr("height", handleLabelHeight)
                .attr("width", handleLabelWidth)
                .attr("y", -(handleLabelHeight / 2))
                .attr("class", "handle-label");

            const handleTextPadding = vis.x.bandwidth() * 0.01;
            let handleText = handleLabel.append("text")
                .attr("class", "slider-percentage")
                .attr("x", handleTextPadding)
                .text(function() { return vis.initialPositions[label] + "%" });

        });

        // Add the total percentage widget



        // Respond to slider drags
        function sliderDrag(value, handle, handleLabel, handleText) {
            handle.attr("cy", vis.y(value));
            handleLabel.attr("transform", "translate(" + sliderTextPadding + "," + vis.y(value) + ")");
            handleText.text(Math.round(value) + "%");

            // Update the total percentage widget
        }

        // Respond to slider end
        function sliderEnd() {

            // Check if input is valid (adds up to 100%)

            // If not, update UI and tell user what to do

            // If input is valid

            // Trigger update of bar graphs
        }
    }


}

export default Mixer;