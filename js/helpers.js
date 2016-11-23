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

    // Once done trying to make room, see if everything fit. Doing is here rather than above prevents repeated
    // checking of the same column as space is made in adjacent columns
    for (let space of spaceAvailable) {

        // If any space is negative, there was not room for the given section of text
        if (space < 0) {

            // Try to make room by moving the anchor point and rotating the text
            text.attr("text-anchor", "start");
            applyRotation(text, 45);

            // Quit looping because it doesn't matter how much room the rest have; the text has already rotated
            break
        }

        // If we get here, everything fit TODO can move this to CSS since this is default
        text.attr("text-anchor", "middle");
    }

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

    // If there is already a tspan
    let existingTspan = text.selectAll('tspan');
    if (existingTspan.empty() === false) {
        let currentWords = [];

        // Reconstruct the complete string with spaces so the following code behaves the same even when tspans already
        // exist
        existingTspan.each(function() {
            currentWords.push(d3.select(this).text());
        });
        text.text(currentWords.join(' '));
    }

    let words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineHeight = 1.1, // ems
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", 0).attr("dy", 0 + "em");

    // Track the distance between the widest line and the edges
    let space = null;

    while (word = words.pop()) {

        // Start building out the current line
        line.push(word);

        // Add the current line to the current tspan
        tspan.text(line.join(" "));

        // See if the current line fits
        let currentSpace = width - tspan.node().getComputedTextLength();
        if (currentSpace <= 0) {

            // If there is only one word and it doesn't fit, the word will always be too long for the provided space
            if (line.length === 1) {

                // Go ahead and add the word, even though it is too wide
                tspan.text(line[0]);

                // There is no need to update the currentSpace since it has already been measured
            }

            // Otherwise, at least one word has fit
            else {

                // Add the word that didn't fit back to the queue because it might fit by itself on the next line
                words.push(word);

                // Add the current line to the current tspan minus the word that was too long
                line.pop();
                tspan.text(line.join(" "));

                // Update the current space before creating a tspan for the next new line because a word has been
                // removed since last measured
                currentSpace = width - tspan.node().getComputedTextLength();
            }

            // Clear the line array to start a new line
            line = [];

            // If there are any words left
            if (words.length > 0) {

                // Add a new line without any current word since, if a word remains, it will be added on the next pass
                // The 'dy' attribute seems to reference the previous tspan element and not the overall text parent
                // Thus, there is no '++lineNumber * lineHeight' line to increment the dy attribute
                // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dy
                // This will need to be tested on other browsers to ensure they respond similarly
                tspan = text.append("tspan").attr("x", 0).attr("dy", lineHeight + "em").text(null);
            }
        }

        space = d3.min([space, currentSpace]);
    }

    // Return the amount of space left to allow for more complex wrapping with adjacent elements
    return space;
}

// Transform the provided text to the given angle while preserving any preexisting translation
function applyRotation(text, angle) {
    if (text.attr("transform") !== null) {
        text.attr("transform", text.attr("transform") + "rotate(" + angle + ")");
    }
    else {
        text.attr("transform", "rotate(" + angle + ")");
    }
}

export { wrapAxis }