class stateBank {
    constructor() {

        // Variable to track state of sliders; initial values = initial state
        this.sliderState = {
            'Alien Invasion': 100,
            'Zombie Apocalypse': 0,
            'Mutant Super-Villain': 0
        };
    }
}

export default (new stateBank);
