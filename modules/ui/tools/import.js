import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';

import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';
import { actionAddEntity } from '../../actions';
import { osmNode } from '../../osm';


export function uiToolImport(context) {

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

        var lastPointerUpType;

        button = selection
            .append('button')
            .attr('class', 'save bar-button')
            .on('pointerup', function(d3_event) {
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click', function(d3_event) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.geojson'; // Accept GeoJSON files
                input.onchange = handleFileSelection;
                input.click();

                function handleFileSelection(event) {
                    const file = event.target.files[0];
                    if (file) {
                      // Read the GeoJSON file
                      const reader = new FileReader();
                      reader.onload = function(e) {
                        const contents = e.target.result;
                        const geojson = JSON.parse(contents);
                        if (geojson.type === 'FeatureCollection') {
                          // Extract points from the GeoJSON and display them on the map
                          const points = geojson.features.filter(
                            feature => feature.geometry.type === 'Point'
                          );
                          displayPointsOnMap(points);
                        } else {
                          console.log('Invalid GeoJSON file. Expected FeatureCollection.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }

                  function displayPointsOnMap(points) {
              
                    // Add imported points to the map
                    points.forEach(function(point) {
                      const nodeId = point.id;
                      const loc = [point.geometry.coordinates[0], point.geometry.coordinates[1]];
                     const node = osmNode({ id: nodeId, loc: loc });
                      context.perform(actionAddEntity(node), 'add imported point');
                      console.log('Points added successfully');
                    });
                  }

            })
            .call(tooltipBehavior);

        button
            .call(svgIcon('#iD-icon-load'));

        button
            .attr('class')
    };
    return tool;
}
