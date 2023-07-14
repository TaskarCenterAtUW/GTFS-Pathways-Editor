import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import { osmNode, osmWay } from '../../osm';
import {select, selectAll} from 'd3-selection';


export function uiSectionMapStyleOptions(context) {

    var section = uiSection('fill-area', context)
        .label(() => t.append('map_data.style_options'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.layer-fill-list')
            .data([0]);

        container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-fill-list')
            .merge(container)
            .call(drawListItems, context.map().areaFillOptions, 'radio', 'area_fill', setFill, isActiveFill);

        var container2 = selection.selectAll('.layer-visual-diff-list')
            .data([0]);

        container2.enter()
            .append('ul')
            .attr('class', 'layer-list layer-visual-diff-list')
            .merge(container2)
            .call(drawListItems, ['highlight_edits'], 'checkbox', 'visual_diff', toggleHighlightEdited, function() {
                return context.surface().classed('highlight-edited');
            });

        drawLevelFilterInput(selection);
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .call(uiTooltip()
                .title(function(d) {
                    return t.append(name + '.' + d + '.tooltip');
                })
                .keys(function(d) {
                    var key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);
                    if (d === 'highlight_edits') key = t('map_data.highlight_edits.key');
                    return key ? [key] : null;
                })
                .placement('top')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .html(function(d) { return t.html(name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', false);
    }

    function isActiveFill(d) {
        return context.map().activeAreaFill() === d;
    }

    function toggleHighlightEdited(d3_event) {
        d3_event.preventDefault();
        context.map().toggleHighlightEdited();
    }

    function setFill(d3_event, d) {
        context.map().activeAreaFill(d);
    }

    function drawLevelFilterInput(selection) {
        var filterContainer = selection.append('div')
            .attr('class', 'level-filter-container');

        filterContainer.append('label')
            .attr('class', 'level-filter-label')
            .text(t('map_data.level_filter'));

        var filterInput = filterContainer.append('input')
            .attr('type', 'text')
            .attr('class', 'level-filter-input')
            .on('input', function() {
                var filter = this.value.trim();
                applyLevelFilter(filter);
            });
    }

    function applyLevelFilter(level) {
        if(!level || level == ""){
            return;
        }
        var graph = context.graph();
        var nodes = Object.values(graph.entities).filter(entity => entity instanceof osmNode);
        var ways = Object.values(graph.entities).filter(entity => entity instanceof osmWay);

        // Loop through all nodes and update the visibility based on the filter
        nodes.forEach(function(node) {
            if (!node.tags || !node.tags.level_id || (parseInt(node.tags.level_id) !== parseInt(level))) {
            const selectedNodes = selectAll('.node')
        .nodes();
      
      selectedNodes.forEach(n => {
        const data = n.__data__;
        const nodeId = data.id;
        // Perform operations with the retrieved node data
        if(nodeId == node.id){
            select(n).style('display', 'none');

        }
      });
        }
        else{
            const selectedNodes = selectAll('.node')
            .nodes();
          
          selectedNodes.forEach(n => {
            const data = n.__data__;
            const nodeId = data.id;
            // Perform operations with the retrieved node data
            if(nodeId == node.id){
                select(n).style('display', 'null');
    
            }});
        }
    });
        
                // Loop through all ways and update the visibility based on the filter
                ways.forEach(function(way) {
                    if (!way.tags || !way.tags.z1 || !way.tags.z2
                         || ((parseInt(way.tags.z1) !== parseInt(level)) 
                         && (parseInt(way.tags.z2) !== parseInt(level)))) {
                    const selectedWays = selectAll('.way')
                .nodes();
              
              selectedWays.forEach(n => {
                const data = n.__data__;
                const wayId = data.id;
                // Perform operations with the retrieved node data
                if(wayId == way.id){
                    select(n).style('display', 'none');
        
                }
              });
                }
                else{
                    const selectedWays = selectAll('.way')
                    .nodes();
                  
                    selectedWays.forEach(n => {
                    const data = n.__data__;
                    const wayId = data.id;
                    // Perform operations with the retrieved node data
                    if(wayId == node.id){
                        select(n).style('display', 'null');
            
                    }});
                }
            });}

    context.map()
        .on('changeHighlighting.ui_style, changeAreaFill.ui_style', section.reRender);

    return section;
}
