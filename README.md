
# AngularJS Automaton Simulator 

This project demonstrates the use of AnuglarJS, to build a simple, but
non-trivial, simulator for one-dimensional celular automata.  

At the core of this application is an angular directive that provides a UI
component for browsing through the results of many successive iterations of a
cellular automata.  In order to support very large data sets that may result
from running the simulation at length, this component renders only those
elements that are visible on the screen at any given time; other elements that
are off the screen are kept in memory, but have no representation in the HTML
DOM.  This keeps the total number of nodes down to a size that most browsers can
handle well.

[A live demo is available here](http://automaton.dev.projectmastermind.com/).


**Browser Support:**  

This application supports the following desktop browsers:

- Chrome 39
- Safari 7
- FireFox 31
- Internet Explorer 11

Though it was not designed for mobile use, the app has been tested, and works
adequately on the following mobile devices:

- Apple iPhone (iOS 8.1)

The application has been tested and is confirmed to work correctly on the
platforms listed above.  Though older browser versions were not tested, many of
them should also work fine.  Versions of IE older than v9 will likely be
problematic.  

A note about Internet Explorer:  Though the application does run correctly on
Internet Explorer, the browser sometimes experiences some difficulty with the
amount of DOM manipulation this component has to do while scrolling -- it is
usable in IE, but the user experience will likely be better in other browsers.


## Usage and Features

By default, the app is configured to generate the "Rule 30" cellular automata,
as described [here](http://mathworld.wolfram.com/Rule30.html).  To start the
simulation, just click the blue "Start" button, and click it again when you're
ready to stop.  When you stop the generator, you'll be able to browse back
through the results by scrolling.  If you'd like to simulate a different "Rule #",
or change the vector size, or initial state seeding, those features are
described below.

**Setup the initial state**

When you first load the app, you'll see a single vector of cells across the top
of the screen, just below a toolbar containing several buttons.  This will
become the initial state vector for the automaton.  It's pre-populated with a
single cell, but you can make changes if you want -- just click on the cells to
toggle them on and off.

**Adjust the Settings**

Several things can be configured.  Click on the settings button to make
adjustments.  Any changes in the settings dialog will throw away the automaton
data, and start over with a clean slate.  The following items can be controlled:

- Automaton Rule:  this is a number between 0 and 255, which completely
  describes the behavior of the automaton.  [See Wolfram for more
info](http://mathworld.wolfram.com/ElementaryCellularAutomaton.html).  
- Automaton Size:  this is the size of the automaton vector (the number of cells
  wide).
- Simulation Speed:  this is the speed at which the system will compute
  successive iterations of the automaton.  It's given in iterations/second.

**Clear and Start Over**

The Reset button will erase all the stored history, and clear the display back
to its original state, but it will not forget any settings you've changed
durring the current session.



## How to Run it Locally

**Prerequisites**

You will need [Node.js](http://nodejs.org/) installed and working.

**Installing the Application**

Clone the repository:

    git clone git@github.com:coltrane/automaton.git

Get the dependencies:

    cd automaton/ npm install
    
`npm install` will also trigger `bower install`, though if it does not for any
reason, you can do so manually.

Now start the server:

    npm start

The script will make sure dependencies are up to date, then you will see output
like this:

>     http-server client/ -a localhost -p 8000 -c-1

>     Starting up http-server, serving client/ on port: 8000 Hit CTRL-C to stop
>     the server

Now just point your browser to [http://localhost:8000/](http://localhost:8000/)

## Implementation 

The implementation consists of the following components, which
are discussed briefly below. Futher information is available as commentary
within the code.

**Entry Point** (`app.js`, `index.html`) These comprise the main entry point
of the application.  `index.html` is an angular template that constructs the
basic layout, and links all the other components.  `app.js` contains an angular
`run()` block which wires the application, and provides some basic functions
that are used by the various controls in the toolbar to manage the simulation.

**AutomatonDataSource** (`automaton/AutomatonDataSource.js`) This component is
responsible for computing successive iterations of the automaton when the
simulation is running.  As new data becomes available it emits `data` events
which are picked up by logic in `app.js`, and added to the AutomatonModel.  The
speed at which the automaton is iterated can be controlled externally.

**AutomatonModel** (`automaton/AutomatonModel.js`) This component is responsible
for storing all data from all iterations computed for the automaton.  The other
components access and use the data from AutomatonModel to render the display.

**AutomatonViewer** (`automaton/AutomatonViewer.js`) This component includes a
directive (`automatonViewer`), and a controller (`AutomatonViewerCtrl`), which
work together to manage the display of automaton data as a graphical grid in the
browser window.  The component is optimized to render only the rows that are
currently visible, which allows it to browse very large datasets without
overtaxing the browser.



