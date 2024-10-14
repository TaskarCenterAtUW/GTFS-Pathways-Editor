import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';
import { actionAddEntity } from '../../actions';
import { osmNode, osmWay } from '../../osm';


export function uiToolImport(context) {

  var stopAndWayIdSet = new Set();

    var tool = {
        id: 'import',
        label: t.append('import.title')
    };

    var button = null;
    var tooltipBehavior = null;
    var key = uiCmd('⌘I');

    tool.render = function(selection) {
        tooltipBehavior = uiTooltip()
            .placement('bottom')
            .title(() => t.append('import.help'))
            .keys([key])
            .scrollContainer(context.container().select('.top-toolbar'));


        button = selection
            .append('button')
            .attr('class', 'save bar-button')
            .on('click', function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.geojson'; // Accept GeoJSON files
                input.multiple = true; // Allow selecting multiple files
                input.onchange = handleFileSelection;
                input.click();

                function handleFileSelection(event) {
                  for (var i = 0; i < event.target.files.length; i++){
                    const file = event.target.files[i];
                    if (file) {
                      // Read the GeoJSON file
                      const reader = new FileReader();
                      reader.onload = function(e) {
                        const contents = e.target.result;
                        const geojson = JSON.parse(contents);
                        if (geojson.type === 'FeatureCollection') {
                          // Extract stops and ways from the GeoJSON and import them
                          const stops = [];
                          const ways = [];
                          geojson.features.forEach(function(feature) {
                            if (feature.geometry.type === 'Point') {
                              stops.push(feature);
                            } else if (feature.geometry.type === 'LineString') {
                              ways.push(feature);
                            }
                          });
                          displayPointsOnMap(stops);
                          importWays(ways);
                        } else {
                          //console.log('Invalid GeoJSON file. Expected FeatureCollection.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }
                  }

                  function generateUniqueId() {

                    var uniqueId = 0;
                    while (stopAndWayIdSet.has(uniqueId)){
                      uniqueId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
                    }
                    return uniqueId;
                  }

                  function importWays(ways) {
                    ways.forEach(function(way) {
                      var wayId = 'w' + way.properties.pathway_id;
                      if (stopAndWayIdSet.has(wayId)){
                        //console.log(wayId);
                        //console.log('ids should be unique. Generating new id');
                        wayId = generateUniqueId();
                      }
                      stopAndWayIdSet.add(wayId);
                      const fromNodeId = 'n' + way.properties.from_stop_id;
                      const toNodeId = 'n' + way.properties.to_stop_id;

                      const fromNode = context.hasEntity(fromNodeId);
                      const toNode = context.hasEntity(toNodeId);


                      if (!fromNode || !toNode) {
                        //console.log('One or both nodes not found');
                        return;
                      }

                      const wayEntity = osmWay({ id: wayId, nodes: [fromNodeId, toNodeId] });
                      //console.log(wayEntity);
                      wayEntity.tags = getTagsFromProperties(way.properties);
                      context.perform(actionAddEntity(wayEntity), 'add imported way');
                      // console.log('Ways added successfully');
                    });
                  }

                  // Helper function to extract tags from properties object
                  function getTagsFromProperties(properties) {
                    const tags = {};
                    for (const key in properties) {
						if (key !== 'pathway_id' && key !== 'from_stop_id' && key !== 'to_stop_id') {
                        tags[key] = properties[key].toString();
                      }
                    }
                    return tags;
                  }


                  function displayPointsOnMap(points) {

                    // Add imported points to the map
                    points.forEach(function(point) {
                      var nodeId = point.properties.stop_id;
                      if (stopAndWayIdSet.has(nodeId)){
                        //console.log(nodeId);
                        //console.log('ids should be unique. New id generated');
                        nodeId = generateUniqueId();
                      }
                        stopAndWayIdSet.add(nodeId);
                        const loc = [point.geometry.coordinates[0], point.geometry.coordinates[1]];
						const node = osmNode({ id: 'n' + nodeId, loc: loc });
                        // Iterate over the properties of the GeoJSON node
						node.tags = {};
                        Object.entries(point.properties).forEach(([key, value]) => {
                          // Exclude the 'stop_id' property
                          if (key !== 'stop_id') {
                            // Add the property as a tag to the OSM node
                            node.tags[key] = value;
                          }
                        });
                        context.perform(actionAddEntity(node), 'add imported point');
                        // console.log(node);
                        // console.log('Points added successfully');
                    });
                  }
            })
            .call(tooltipBehavior);

        button
            .call(svgIcon('#iD-icon-load'));

        button
            .attr('class');
    };
    return tool;
}
