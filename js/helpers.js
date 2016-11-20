import * as d3 from "d3";

// Wraps SVG text to the provided width, used from: https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
    console.log(text);
    let rotate = false; // for rotating text when even single word doesn't fit

    text.each(function() {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y") === null ? 0: text.attr("y"),
            dy = 0,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {

                // If even one word doesn't fit, flag for rotation
                if (line.length === 1) {
                    rotate = true;
                    lineNumber--; // Prevent single long word from being moved to the next line
                }
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
    if (rotate === true) {
        text.attr("text-anchor", "start");
        applyRotation(45);
    }
    else {
        text.attr("text-anchor", "middle");
    }

    function applyRotation(angle) {
        if (text.attr("transform") !== null) {
            console.log(text);
            text.attr("transform", text.attr("transform") + "rotate(" + angle + ")");
        }
        else {
            text.attr("transform", "rotate(" + angle + ")");
        }
    }
}

export { wrap }