import * as d3 from "d3";

// Wraps SVG text to the provided width, used from: https://bl.ocks.org/mbostock/7555321
// Since this uses rotation, text should be positioned on the page originally using translate instead of y, which
// would result in text rotating out of the intended position.
// Width refers to the width of each column.
function wrapAxis(text, width) {

    // Array to track unused space in each column, allowing adjacent columns to "spill over" when there is room
    let spaceAvailable = [];

    // Create array with discrete selections for each element to enable more precise flow control
    let elements = [];

    text.each(function() {
        spaceAvailable.push(null);
        elements.push(d3.select(this));
    });

    // Loop over each element, wrapping text and rotating to make room as required for each
    for (let i = 0; i < elements.length; i++) {

        spaceAvailable[i] = wrapText(elements[i], width + getAdjacentSpace(i));

        // If you created space this round and there wasn't any on the previous, try it again
        if (i > 0 && spaceAvailable[i] > 0 && spaceAvailable[i - 1] < 0) {
            wrapText(elements[i - 1], width + getAdjacentSpace(i - 1));
        }
    }

//    if (rotate === true) {
//        text.attr("text-anchor", "start");
//        applyRotation(45);
//    }
//    else {
//        text.attr("text-anchor", "middle");
//    }

    // Gets the space available around a given element
    function getAdjacentSpace(i) {
        if (i > 0 && i < elements.length - 1) {
            return (spaceAvailable[i + 1] + spaceAvailable[i - 1]) / 2
        }

        else if (i === 0) {
            return spaceAvailable[i + 1] / 2; // Divide by two since it refers to total space and text is centered
        }

        // Otherwise, we must be at the end of the array
        else {
            return spaceAvailable[i - 1] / 2
        }
    }

}

// Wraps text for a single element
function wrapText(text, width) {

    let words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", 0 + "em");

    // Track the distance between the widest line and the edges
    let space = null;

    while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));

        // See if the current line will fit
        let currentSpace = width - tspan.node().getComputedTextLength();
        if (currentSpace <= 0) {

            if (line.length === 1) {
                lineNumber--; // Prevent single long word from being moved to the next line
            }
            line.pop(); // TODO this could leave nothing on the line if there was one word that didn't fit
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("dy", ++lineNumber * lineHeight + "em").text(word);

            currentSpace = width - tspan.node().getComputedTextLength();
        }

        space = d3.min([space, currentSpace]);
    }

    // Return the amount of space left to allow for more complex wrapping with adjacent elements
    return space;
}

function applyRotation(angle) {
    console.log(text.attr("transform"));
    if (text.attr("transform") !== null) {
        text.attr("transform", text.attr("transform") + "rotate(" + angle + ")");
    }
    else {
        text.attr("transform", "rotate(" + angle + ")");
    }
}

export { wrapAxis }