import _debounce from 'lodash-es/debounce';
import { select as d3_select } from 'd3-selection';

import { localizer, t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import { uiSettingsLocalPhotos } from '../settings/local_photos';
import { svgIcon } from '../../svg';

export function uiSectionPhotoOverlays(context) {

    var settingsLocalPhotos = uiSettingsLocalPhotos(context)
        .on('change',  localPhotosChanged);

    var layers = context.layers();

    var section = uiSection('photo-overlays', context)
        .label(() => t.append('photo_overlays.title'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.photo-overlay-container')
            .data([0]);

        container.enter()
            .append('div')
            .attr('class', 'photo-overlay-container')
            .merge(container)
            .call(drawLocalPhotos);
    }

    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
    }

    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }

    function setLayer(which, enabled) {
        var layer = layers.layer(which);
        if (layer) {
            layer.enabled(enabled);
        }
    }

    function drawLocalPhotos(selection) {
        var photoLayer = layers.layer('local-photos');
        var hasData = photoLayer && photoLayer.hasData();
        var showsData = hasData && photoLayer.enabled();

        var ul = selection
            .selectAll('.layer-list-local-photos')
            .data(photoLayer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-local-photos');

        var localPhotosEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-local-photos');

        var localPhotosLabelEnter = localPhotosEnter
            .append('label')
            .call(uiTooltip().title(() => t.append('local_photos.tooltip')));

        localPhotosLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('local-photos'); });

        localPhotosLabelEnter
            .call(t.append('local_photos.header'));

        localPhotosEnter
            .append('button')
            .attr('class', 'open-data-options')
            .call(uiTooltip()
                .title(() => t.append('local_photos.tooltip_edit'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editLocalPhotos();
            })
            .call(svgIcon('#iD-icon-more'));

        localPhotosEnter
            .append('button')
            .attr('class', 'zoom-to-data')
            .call(uiTooltip()
                .title(() => t.append('local_photos.zoom'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                if (d3_select(this).classed('disabled')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();
                photoLayer.fitZoom();
            })
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-local-photos')
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData)
            .property('checked', showsData);

        ul.selectAll('button.zoom-to-data')
            .classed('disabled', !hasData);
    }

    function editLocalPhotos() {
        context.container()
            .call(settingsLocalPhotos);
    }

    function localPhotosChanged(d) {
        var localPhotosLayer = layers.layer('local-photos');

        localPhotosLayer.fileList(d);
    }

    context.layers().on('change.uiSectionPhotoOverlays', section.reRender);
    context.photos().on('change.uiSectionPhotoOverlays', section.reRender);

    context.map()
        .on('move.photo_overlays',
            _debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
