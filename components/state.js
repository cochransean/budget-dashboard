import { values, keys } from 'd3';

class stateBank {
    constructor() {

        // Variable to track state of sliders; initial values = initial state
        this._sliderState = {
            'Alien Invasion': 100,
            'Zombie Apocalypse': 0,
            'Mutant Super-Villain': 0
        };

        // Calculate the total
        this.sliderTotal = this.calcTotal();
    }

    // Changes the value of a label and recalculates the total
    setSlider(label, value) {
        this._sliderState[label] = value;
        this.sliderTotal = this.calcTotal();
    }

    // Returns the value of a label
    getSlider(label) {
        return this._sliderState[label]
    }

    // Gets slider names
    getSliderNames() {
        return keys(this._sliderState);
    }


    calcTotal() {
        return values(this._sliderState).reduce(function(prev, current) {
            return prev + current
        });
    }
}

export default (new stateBank);
