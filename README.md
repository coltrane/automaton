
### AngularJS Automaton Simulator Application

This project demonstrates the use of AnuglarJS, to build a simple, 
but non-trivial, simulator for one-dimensional celular automata.

[A live demo is available here](http://automaton.dev.projectmastermind.com/).


## Running Locally
To run locally, first clone the repository:




## Implementation 
The implementation consists of the following components, which
are discussed briefly below. Futher information is available as
commentary within the code.

# Entry Point (`app.js`, `index.html`)
These comprise the main entry point of the application.  `index.html`
is an angular template that constructs the basic layout, and links 
all the other components.  `app.js` contains an angular `run()` block
which wires the application, and provides some basic functions that
are used by the various controls in the toolbar to manage the simulation.

# AutomatonDataSource (`automaton/AutomatonDataSource.js`)
This component is responsible for computing successive iterations of the
automaton when the simulation is running.  As new data becomes available
it emits `data` events which are picked up by logic in `app.js`, and
added to the AutomatonModel.  The speed at which the automaton is 
iterated can be controlled externally.

# AutomatonModel (`automaton/AutomatonModel.js`)
This component is responsible for storing all data from all iterations
computed for the automaton.  The other components access and use the
data from AutomatonModel to render the display.

# AutomatonViewer (`automaton/AutomatonViewer.js`)
This component includes a directive (`automatonViewer`), and a controller
(`AutomatonViewerCtrl`), which work together to manage the display of
automaton data as a graphical grid in the browser window.  The component
is optimized to render only the rows that are currently visible, which
allows it to browse very large datasets without overtaxing the browser.



