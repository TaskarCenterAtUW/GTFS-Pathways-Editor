import { operationDelete } from '../operations/delete';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMissingTag(context) {
    var type = 'missing_tag';

    function hasDescriptiveTags(entity) {
        var onlyAttributeKeys = ['description', 'name', 'note', 'start_date'];
        var entityDescriptiveKeys = Object.keys(entity.tags)
            .filter(function(k) {
                if (k === 'area' || !osmIsInterestingTag(k)) return false;

                return !onlyAttributeKeys.some(function(attributeKey) {
                    return k === attributeKey || k.indexOf(attributeKey + ':') === 0;
                });
            });

        if (entity.type === 'relation' &&
            entityDescriptiveKeys.length === 1 &&
            entity.tags.type === 'multipolygon') {
            // this relation's only interesting tag just says its a multipolygon,
            // which is not descriptive enough
            return false;
        }

        return entityDescriptiveKeys.length > 0;
    }

    function isUnknownRoad(entity) {
        return entity.type === 'way' && entity.tags.highway === 'road';
    }

    function isUntypedRelation(entity) {
        return entity.type === 'relation' && !entity.tags.type;
    }

    function isUnknownLevel(entity) {
        return entity.type === 'node' && !entity.tags.level_id;
    }

    var validation = function checkMissingTag(entity, graph) {

        var subtype;

        var osm = context.connection();
        var isUnloadedNode = entity.type === 'node' && osm && !osm.isDataLoaded(entity.loc);

        // we can't know if the node is a vertex if the tile is undownloaded
        if (!isUnloadedNode &&
            // allow untagged nodes that are part of ways
            entity.geometry(graph) !== 'vertex' &&
            // allow untagged entities that are part of relations
            !entity.hasParentRelations(graph)) {

            if (Object.keys(entity.tags).length === 0) {
                subtype = 'any';
            } else if (!hasDescriptiveTags(entity)) {
                subtype = 'descriptive';
            } else if (isUntypedRelation(entity)) {
                subtype = 'relation_type';
            }
        }

        // flag an unknown road even if it's a member of a relation
        if (!subtype && isUnknownRoad(entity)) {
            subtype = 'highway_classification';
        }

        // flag missing levels even if it's part of a relation
        if (!subtype && isUnknownLevel(entity)) {
            subtype = 'unknown_level';
        }

        if (!subtype) return [];

        var messageID = subtype === 'unknown_level' ? 'missing_level' : 'missing_tag.' + subtype;
        var referenceID = subtype === 'unknown_level' ? 'missing_level' : 'missing_tag';

        // can always delete if the user created it in the first place..
        var canDelete = (entity.version === undefined || entity.v !== undefined);
        var severity = (canDelete && subtype !== 'unknown_level') ? 'error' : 'warning';

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: severity,
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.' + messageID + '.message', {
                    feature: utilDisplayLabel(entity, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            dynamicFixes: function(context) {

                var fixes = [];

                var selectFixType = subtype === 'highway_classification' ? 'select_road_type' : 'address_the_concern';

                fixes.push(new validationIssueFix({
                    icon: 'iD-icon-search',
                    title: t.append('issues.fix.' + selectFixType + '.title'),
                }));

                var deleteOnClick;

                var id = this.entityIds[0];
                var operation = operationDelete(context, [id]);
                var disabledReasonID = operation.disabled();
                if (!disabledReasonID) {
                    deleteOnClick = function(context) {
                        var id = this.issue.entityIds[0];
                        var operation = operationDelete(context, [id]);
                        if (!operation.disabled()) {
                            operation();
                        }
                    };
                }

                return fixes;
            }
        })];

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.' + referenceID + '.reference'));
        }
    };

    validation.type = type;

    return validation;
}
