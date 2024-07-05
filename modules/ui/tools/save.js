import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';

import { t } from '../../core/localizer';
import { modeSave, modeBrowse } from '../../modes';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';
import { JXON } from '../../util/jxon';
import { actionDiscardTags } from '../../actions/discard_tags';
import { osmChangeset } from '../../osm';
import { fileFetcher } from '../../core/file_fetcher';
import { osmNode } from '../../osm';
import { osmWay } from '../../osm';

export function uiToolSave(context) {

    var tool = {
        id: 'save',
        label: t.append('save.title')
    };

    var button = null;
    var tooltipBehavior = null;
    var history = context.history();
    var key = uiCmd('⌘S');
    var _numChanges = 0;

    function isSaving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }

    function isDisabled() {
        return _numChanges === 0 || isSaving();
    }

    var _discardTags = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    function save(d3_event) {
        d3_event.preventDefault();
        if (!context.inIntro() && !isSaving() && history.hasChanges()) {
            context.enter(modeSave(context));

        const graph = context.graph();
    
        // Retrieve all nodes and ways from the graph's entities
        const nodes = Object.values(graph.entities).filter(entity => entity instanceof osmNode);
        const ways = Object.values(graph.entities).filter(entity => entity instanceof osmWay);

        var nodeFeatures = [];
        var wayFeatures = [];


        if (nodes) {
            // Convert nodes to GeoJSON Point features
            nodeFeatures = nodes.map(node => {
                const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: node.loc,
                },
                properties: {
                    stop_id: node.id.substring(1),
                    ...node.tags,
                },
                };
                return feature;
            });
            }
            
            if (ways) {
            // Convert ways to GeoJSON LineString features
            wayFeatures = ways.map(way => {
                const feature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: way.nodes.map(nodeId => graph.entity(nodeId).loc),
                },
                properties: {
                    pathway_id: way.id.substring(1),
                    ...way.tags,
                },
                };
                return feature;
            });
            }

        // Create a FeatureCollection combining nodeFeatures and wayFeatures
        const featureCollection = {
            type: 'FeatureCollection',
            features: [...nodeFeatures, ...wayFeatures],
        };

        // Convert the featureCollection to GeoJSON string
        const geoJSONString = JSON.stringify(featureCollection);

        // Create a Blob object from the GeoJSON string
        const blob = new Blob([geoJSONString], { type: 'application/json' });

        // Create a download link for the Blob object
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'data.geojson'; // Set the desired file name

        // Programmatically click the download link to trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Download changeset link
        var changeset = new osmChangeset().update({ id: undefined });
        var changes = history.changes(actionDiscardTags(history.difference(), _discardTags));

        delete changeset.id;  // Export without chnageset_id

        var data = JXON.stringify(changeset.osmChangeJXON(changes));
        var blob2 = new Blob([data], {type: 'text/xml;charset=utf-8;'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob2);
        link.download = 'changeset.osc';
        link.click();
        
        // Clean up the created URL object
        URL.revokeObjectURL(link.href);

        context.enter(modeBrowse(context));        
        }
    }

    function bgColor(numChanges) {
        var step;
        if (numChanges === 0) {
            return null;
        } else if (numChanges <= 50) {
            step = numChanges / 50;
            return d3_interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
        } else {
            step = Math.min((numChanges - 50) / 50, 1.0);
            return d3_interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
        }
    }

    function updateCount() {
        var val = history.difference().summary().length;
        if (val === _numChanges) return;

        _numChanges = val;

        if (tooltipBehavior) {
            tooltipBehavior
                .title(() => t.append(_numChanges > 0 ? 'save.help' : 'save.no_changes'))
                .keys([key]);
        }

        if (button) {
            button
                .classed('disabled', isDisabled())
                .style('background', bgColor(_numChanges));

            button.select('span.count')
                .text(_numChanges);
        }
    }

    tool.render = function(selection) {
        tooltipBehavior = uiTooltip()
            .placement('bottom')
            .title(() => t.append('save.no_changes'))
            .keys([key])
            .scrollContainer(context.container().select('.top-toolbar'));

        var lastPointerUpType;

        button = selection
            .append('button')
            .attr('class', 'save disabled bar-button')
            .on('pointerup', function(d3_event) {
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click', function(d3_event) {
                save(d3_event);

                if (_numChanges === 0 && (
                    lastPointerUpType === 'touch' ||
                    lastPointerUpType === 'pen')
                ) {
                    // there are no tooltips for touch interactions so flash feedback instead
                    context.ui().flash
                        .duration(2000)
                        .iconName('#iD-icon-save')
                        .iconClass('disabled')
                        .label(t.append('save.no_changes'))();
                }
                lastPointerUpType = null;
            })
            .call(tooltipBehavior);

        button
            .call(svgIcon('#iD-icon-save'));

        button
            .append('span')
            .attr('class', 'count')
            .attr('aria-hidden', 'true')
            .text('0');

        updateCount();


        context.keybinding()
            .on(key, save, true);


        context.history()
            .on('change.save', updateCount);

        context
            .on('enter.save', function() {
                if (button) {
                    button
                        .classed('disabled', isDisabled());

                    if (isSaving()) {
                        button.call(tooltipBehavior.hide);
                    }
                }
            });
    };


    tool.uninstall = function() {
        context.keybinding()
            .off(key, true);

        context.history()
            .on('change.save', null);

        context
            .on('enter.save', null);

        button = null;
        tooltipBehavior = null;
    };

    return tool;
}
