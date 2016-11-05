import * as d3 from "d3";

class Mixer {

    constructor(parentDivID) {
        const vis = this;
        vis.parentDivID = '#' + parentDivID;
        vis.sliderLabels = ['Alien Invasion', 'Zombie Apocalypse', 'Mutant Super-Villain'];
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
            .range([0, vis.height]);

        // Add sliders
        vis.sliderLabels.forEach(function(label) {

            // Append group for each
            let slider = vis.svg.append("g")
                .attr("class", "slider")
                .attr("transform", "translate(" + (vis.x(label) + vis.x.bandwidth() / 2) + ", 0)");

            // TODO this is pasted and is for horizontal slider; fix to match
            slider.append("line")
                .attr("class", "track")
                .attr("y1", 0)
                .attr("y2", vis.height)
                .select(function() { console.log(this); return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-inset")
                .select(function() { console.log(this); return this.parentNode.appendChild(this.cloneNode(true)); })
                .attr("class", "track-overlay")
                .call(d3.drag()
                    .on("start.interrupt", function() { slider.interrupt(); })
                    .on("start drag", function() { console.log('Drag started.'); }));

            slider.append("text")
                .attr("y", vis.height * 1.25)
                .attr("class", "slider-label")
                .text(label);

            let handle = slider.insert("circle", ".track-overlay")
                .attr("class", "handle")
                .attr("r", 9);

        });

        // Add the total percentage widget


    }

}

export default Mixer;