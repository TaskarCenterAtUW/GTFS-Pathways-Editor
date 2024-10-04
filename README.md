# JavaScript editor for [GTFS Pathways Data](https://gtfs.org/documentation/schedule/examples/pathways/#)

*TODO: Update build workflow*
[![build](https://github.com/openstreetmap/iD/workflows/build/badge.svg)](https://github.com/openstreetmap/iD/actions?query=workflow%3A%22build%22)

## Basics

A JavaScript-based tool to map transit stations, using the [GTFS Pathways Data](https://gtfs.org/documentation/schedule/examples/pathways/#) data specification. Developed by the [Taskar Center for Accessible Technology](https://tcat.cs.washington.edu/).  

* It supports all popular modern desktop browsers: Chrome, Firefox, Safari, Opera, and Edge.
* Pathways Editor is a fork of [iD OpenStreetMap Editor](https://github.com/openstreetmap/iD/tree/develop)
* Data is rendered with [d3.js](https://d3js.org/).
* Check out [our roadmap](ROADMAP.md) for current & in-development features.

## Local Installation

Quick steps to install, build and run pathways locally:

### Building Pathways Editor

1. cd into the project folder
2. `npm clean-install` to install dependencies (`npm install` also works, but is slower as it also checks for available updates for the to be installed dependencies)
3. `npm run all` to generate static assets (translation strings, icons, etc.)
4. `npm start` to start up a development instance locally
5. open http://127.0.0.1:8080 in a web browser


The development server refreshes itself automatically whenever you change something in the code (except for static assets like translation strings, icons, etc.). However, this does not yet support hot code reloading, so you need to refresh the page in the browser in order to get the respective changes.

### Other Commands

A few more useful commands are:

* `npm test` runs test suite: please execute these before submitting a pull request!
* `npm lint` checks for for code formatting mistakes
* `npm run build` generates a production build, whose results (static html, js, css and assets) are written to the dist directory. This directory is self-contained; you can copy it into the public directory of your webserver to deploy.

## Development Information

Pathways Editor is a fork from iD Editor, an open-source project with 10+ years of development history. For this reason, development can be tricky to jump into. The best way to get familiar with the code style and patterns is to check out the documentation for iD Editor: [How to Get Started with iD Editor](https://github.com/openstreetmap/iD/wiki/How-to-get-started#build-and-test-instructions)

Other resources:

* iD Editor [architecture documentation](https://github.com/openstreetmap/iD/blob/develop/ARCHITECTURE.md) covers the basic functions of the code base
* Read up on [contributing and development style](CONTRIBUTING.md)
* See [open issues in the issue tracker](https://github.com/TaskarCenterAtUW/GTFS-Pathways-Editor/pulls?state=open)
if you're looking for contribution opportunities.
* TODO: add instructions for testing pre-release versions if we want to support that

Need help? Visit us at:
* [OpenSidewalks Slack](https://opensidewalks.slack.com/) (`#general` channel)


## License

*TODO: Update License to be accurate*

The following is the license information for iD: 

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.

iD also bundles portions of the following open source software.

* [D3.js (BSD-3-Clause)](https://github.com/d3/d3)
* [CLDR (Unicode Consortium Terms of Use)](https://github.com/unicode-cldr/cldr-json)
* [editor-layer-index (CC-BY-SA 3.0)](https://github.com/osmlab/editor-layer-index)
* [Font Awesome (CC-BY 4.0)](https://fontawesome.com/license)
* [Maki (CC0 1.0)](https://github.com/mapbox/maki)
* [Temaki (CC0 1.0)](https://github.com/ideditor/temaki)
* [Röntgen icon set (CC-BY 4.0)](https://github.com/enzet/map-machine#r%C3%B6ntgen-icon-set)
* [Mapillary JS (MIT)](https://github.com/mapillary/mapillary-js)
* [iD Tagging Schema (ISC)](https://github.com/openstreetmap/id-tagging-schema)
* [name-suggestion-index (BSD-3-Clause)](https://github.com/osmlab/name-suggestion-index)
* [osm-community-index (ISC)](https://github.com/osmlab/osm-community-index)


## Thank you

*TODO: Update with grant information*

