import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';
import { actionAddEntity } from '../../actions';
import { osmNode } from '../../osm';
import { osmWay } from '../../osm';


export function uiToolImport(context) {

  var stopAndWayIdSet = new Set();

    var tool = {
        id: 'import',
        label: t.append('import.title')
    };

    var button = null;
    var tooltipBehavior = null;
    var key = uiCmd('⌘I');


// Type of the location:
// https://gtfs.org/reference/static/#stopstxt
// - `0` (or blank): Stop (or Platform). A location where passengers board or disembark from a transit vehicle. Is called a platform when defined within a parent_station.
// todo [breaking]: rename to STOP_OR_PLATFORM
const STOP = '0'
// - `1`: Station. A physical structure or area that contains one or more platform.
const STATION = '1'
// - `2`: Entrance/Exit. A location where passengers can enter or exit a station from the street. If an entrance/exit belongs to multiple stations, it can be linked by pathways to both, but the data provider must pick one of them as parent.
// todo [breaking]: rename to ENTRANCE_OR_EXIT
const ENTRANCE_EXIT = '2'
// - `3`: Generic Node. A location within a station, not matching any other location_type, which can be used to link together pathways define in pathways.txt.
const GENERIC_NODE = '3'
// - `4`: Boarding Area. A specific location on a platform, where passengers can board and/or alight vehicles.
const BOARDING_AREA = '4'

// possible pathway_mode values:
// https://gtfs.org/reference/static/#pathwaystxt
// - `1`: Walkway.
const WALKWAY = '1'
// - `2`: Stairs.
const STAIRS = '2'
// - `3`: Moving sidewalk/travelator.
const MOVING_SIDEWALK_TRAVELATOR = '3'
// - `4`: Escalator.
const ESCALATOR = '4'
// - `5`: Elevator.
const ELEVATOR = '5'
// - `6`: Fare gate (or payment gate): A pathway that crosses into an area of the station where proof of payment is required to cross. Fare gates may separate paid areas of the station from unpaid ones, or separate different payment areas within the same station from each other. This information can be used to avoid routing passengers through stations using shortcuts that would require passengers to make unnecessary payments, like directing a passenger to walk through a subway platform to reach a busway.
const FARE_GATE = '6'
// - `7`: Exit gate: A pathway exiting a paid area into an unpaid area where proof of payment is not required to cross.
const EXIT_GATE = '7'

const pathwaysGeoJSON = async (stopsSrc, pathwaysSrc, opt = {}) => {
	const {
		pathwayProps,
		nodeProps,
		logErrorMsg,
	} = {
		logErrorMsg: console.error,
		...opt,
	}

	const nodes = Object.create(null) // nodes, by stop_id
	const stations = Object.create(null) // "top-most" parent_station, by stop_id

  const resultData = [];

	for await (const s of stopsSrc) {
		const props = {}
		nodes[s.stop_id] = [
			parseFloat(s.stop_lon),
			parseFloat(s.stop_lat),
			s.stop_name || null,
			s.location_type,
			s.level_id,
			{
				...props,
				...nodeProps(s),
			},
		]

		// stops.txt is sorted so that we get stations first.
		stations[s.stop_id] = s.parent_station
			? stations[s.parent_station] || s.parent_station
			: s.stop_id
	}

	const pws = Object.create(null) // pathways, grouped by station ID

	for await (const pw of pathwaysSrc) {
		const props = {}

		const encodedPw = [
			pw.pathway_id || undefined,
			pw.from_stop_id,
			pw.to_stop_id,
			pw.pathway_mode ? parseInt(pw.pathway_mode) : undefined,
			pw.is_bidirectional === '1',
			pw.length ? parseFloat(pw.length) : undefined,
			pw.traversal_time ? parseInt(pw.traversal_time) : undefined,
			pw.stair_count ? parseInt(pw.stair_count) : undefined,
			pw.max_slope ? parseFloat(pw.max_slope) : undefined,
			pw.min_width ? parseFloat(pw.min_width) : undefined,
			pw.signposted_as || undefined,
			pw.reversed_signposted_as || undefined,
			{
				...props,
				...pathwayProps(pw),
			},
		]

		const fromStationId = stations[pw.from_stop_id]
		if (pws[fromStationId]) {
			pws[fromStationId].push(encodedPw)
		}
		else {
			pws[fromStationId] = [encodedPw]
		}

		const toStationId = stations[pw.to_stop_id]
		if (toStationId !== fromStationId) {
			if (pws[toStationId]) {
				pws[toStationId].push(encodedPw)
			}
			else {
				pws[toStationId] = [encodedPw]
			}
		}

		if (pw.is_bidirectional === '1') {
			const props = {}

			const encodedPw = [
				pw.pathway_id || undefined,
				pw.to_stop_id,
				pw.from_stop_id,
				pw.pathway_mode ? parseInt(pw.pathway_mode) : undefined,
				pw.is_bidirectional === '1',
				pw.length ? parseFloat(pw.length) : undefined,
				pw.traversal_time ? parseInt(pw.traversal_time) : undefined,
				pw.stair_count ? parseInt(pw.stair_count) : undefined,
				pw.max_slope ? parseFloat(pw.max_slope) : undefined,
				pw.min_width ? parseFloat(pw.min_width) : undefined,
				pw.signposted_as || undefined,
				pw.reversed_signposted_as || undefined,
				{
					...props,
					...pathwayProps(pw),
				},
			]
	
			const fromStationId = stations[pw.to_stop_id]
			if (pws[fromStationId]) {
				pws[fromStationId].push(encodedPw)
			}
			else {
				pws[fromStationId] = [encodedPw]
			}
	
			const toStationId = stations[pw.from_stop_id]
			if (toStationId !== fromStationId) {
				if (pws[toStationId]) {
					pws[toStationId].push(encodedPw)
				}
				else {
					pws[toStationId] = [encodedPw]
				}
			}
		}
	}

	for (const stationId in pws) {
		let data = '{"type": "FeatureCollection", "features": ['
		let first = true
		const addFeature = (feature) => {
			data += (first ? '' : ',') + JSON.stringify(feature) + '\n'
			first = false
		}

		const nodesAdded = new Set()
		const addNode = (nodeId, pathwayId) => {
			if (nodesAdded.has(nodeId)) return;
			if (!(nodeId in nodes)) {
				logErrorMsg(`node ${nodeId} does not exist, used in pathway ${pathwayId}`)
				return;
			}
			nodesAdded.add(nodeId)

			const n = nodes[nodeId]
			// todo: n might be undefined!
			addFeature({
				type: 'Feature',
				properties: {
					stop_id: nodeId,
					stop_name: n[2],
					location_type: n[3],
					level_id: n[4],
					...n[5], // additional props
				},
				geometry: {
					type: 'Point',
					coordinates: [n[0], n[1]],
				},
			})
		}

		for (const pw of pws[stationId]) {
			const [
				pathway_id,
				from_stop_id, to_stop_id,
			] = pw
			addNode(from_stop_id, pathway_id)
			addNode(to_stop_id, pathway_id)

			const fromNode = nodes[from_stop_id]
			if (!fromNode) {
				logErrorMsg(`invalid from_stop_id "${from_stop_id}" in pathway ${pw[0]}`)
				continue
			}
			const toNode = nodes[to_stop_id]
			if (!toNode) {
				logErrorMsg(`invalid to_stop_id "${to_stop_id}" in pathway ${pw[0]}`)
				continue
			}

			addFeature({
				type: 'Feature',
				properties: {
					pathway_id,
					pathway_mode: pw[3],
					is_bidirectional: pw[4],
					length: pw[5],
					traversal_time: pw[6],
					stair_count: pw[7],
					max_slope: pw[8],
					min_width: pw[9],
					signposted_as: pw[10],
					reversed_signposted_as: pw[11],
					...pw[12], // additional props
				},
				geometry: {
					type: 'LineString',
					coordinates: [
						[fromNode[0], fromNode[1]],
						[toNode[0], toNode[1]],
					],
				},
			})
		}

		data += ']}'
    resultData.add(data);
	}
  return resultData;
}
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
                input.multiple = true; // Allow selecting multiple files
                input.onchange = handleFileSelection;
                input.click();

                function handleFileSelection(event) {
                  for(var i = 0; i < event.target.files.length; i++){
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
                          console.log('Invalid GeoJSON file. Expected FeatureCollection.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }
                  }

                  function generateUniqueId() {

                    var uniqueId = 0;
                    while(stopAndWayIdSet.has(uniqueId)){
                      uniqueId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
                    }
                    return uniqueId;
                  }

                  function importWays(ways) {
                    ways.forEach(function(way) {
                      var wayId = 'w' + way.properties.pathway_id;
                      if(stopAndWayIdSet.has(wayId)){
                        console.log(wayId);
                        console.log('ids should be unique. Generating new id');
                        wayId = generateUniqueId();
                      }
                      stopAndWayIdSet.add(wayId);
                      const fromNodeId = 'n' + way.properties.from_stop_id;
                      const toNodeId = 'n' + way.properties.to_stop_id;
                  
                      const fromNode = context.hasEntity(fromNodeId);
                      const toNode = context.hasEntity(toNodeId);

                  
                      if (!fromNode || !toNode) {
                        console.log('One or both nodes not found');
                        return;
                      }
                  
                      const wayEntity = osmWay({ id: wayId, nodes: [fromNodeId, toNodeId] });
                      console.log(wayEntity);
                      wayEntity.tags = getTagsFromProperties(way.properties);
                      context.perform(actionAddEntity(wayEntity), 'add imported way');
                      console.log('Ways added successfully');
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
                      if(stopAndWayIdSet.has(nodeId)){
                        console.log(nodeId);
                        console.log('ids should be unique. New id generated');
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
                        console.log(node);
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
