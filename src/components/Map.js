import * as d3 from 'd3';
import { calculateSalesByState, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStationsCountByState, getStationsByState } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesCountByState } from '../utils/dataLoaders/incentivesLoader';
import { updateSelectedState } from './LineGraph';
import { getStartDate, getEndDate } from './stateManager'; // Import des dates dynamiques

let salesData = null;
let chargingData = null;
let incentivesData = null;
let activeState = null; // État actuellement sélectionné
let filteredStationsByState = {};
let projection = null;

// Charger les données une seule fois
(async () => {
    try {
        salesData = await loadSalesData();

        const stationsResponse = await fetch('/data/stations_par_etat.json');
        if (!stationsResponse.ok) throw new Error(`Erreur HTTP Stations: ${stationsResponse.status}`);
        chargingData = await stationsResponse.json();

        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData = await incentivesResponse.json();
        // Initialiser la carte avec les dates par défaut
        renderMap(getStartDate(), getEndDate());
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
    }
})();

let onStateSelectionChange = null; // Callback pour notifier les changements d'état

export function setOnStateSelectionChange(callback) {
    onStateSelectionChange = callback; // Enregistrer le callback
}

// Fonction appelée lorsque la timeline change
export function handleTimelineChange() {
    if (activeState) {
        // Si un état est sélectionné, mettre à jour les stations affichées
        const currentStartDate = getStartDate();
        const currentEndDate = getEndDate();

        const filteredStations = filteredStationsByState[activeState]?.filter(station => {
            const stationDate = new Date(station["Open Date"]);
            return stationDate >= currentStartDate && stationDate <= currentEndDate;
        }) || [];

        // Réafficher les stations avec les nouvelles dates
        updateStationsForState(activeState, filteredStations);
    } else {
        // Si aucun état n'est sélectionné, mettre à jour toute la carte
        renderMap(getStartDate(), getEndDate());
    }
}

export function renderMap(startDate, endDate) {
    if (!salesData || !chargingData || !incentivesData) {
        console.error('Les données ne sont pas complètement chargées.');
        return;
    }

    const salesResults = calculateSalesByState(startDate, endDate, {
        evData: salesData.evData,
        hevData: salesData.hevData,
        phevData: salesData.phevData,
    });

    // Mettre à jour les données des stations filtrées
    filteredStationsByState = getStationsByState(chargingData, startDate, endDate);
    const stationsCount = getStationsCountByState(filteredStationsByState);
    const incentivesCount = getIncentivesCountByState(incentivesData, startDate, endDate);

    const svg = d3.select('.map svg');

    if (svg.empty()) {
        initializeMap(salesResults, stationsCount, incentivesCount, filteredStationsByState);
    } else {
        updateMap(svg, salesResults, stationsCount, incentivesCount, filteredStationsByState);
    }
}

function initializeMap(salesResults, stationsCount, incentivesCount, stationsByState) {
    const container = d3.select('.map');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(Math.min(width, height) * 2.1);

    const path = d3.geoPath().projection(projection);

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    const mapLayer = svg.append('g').attr('class', 'map-layer');
    const stationLayer = svg.append('g').attr('class', 'stations-layer');

    // Ajout d'un gestionnaire de clic pour désélectionner l'état
    svg.on('click', function (event) {
        const target = d3.select(event.target);
        if (!target.classed('state')) {
            deselectState(svg, stationLayer);
        }
    });

    d3.json('/data/us-states.json').then((geoData) => {
        mapLayer.selectAll('path')
            .data(geoData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', '#4a90e2')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('class', 'state')
            .on('mouseover', function (event, d) {
                const state = d.properties.NAME;

                const evSales = salesResults.evData[state] || 0;
                const hevSales = salesResults.hevData[state] || 0;
                const phevSales = salesResults.phevData[state] || 0;
                const stations = stationsCount[state] || 0;
                const incentives = incentivesCount[state] || 0;

                tooltip.style('opacity', 1).html(`
                    <strong>${state}</strong><br>
                    EV: ${evSales}<br>
                    HEV: ${hevSales}<br>
                    PHEV: ${phevSales}<br>
                    Charging stations: ${stations}<br>
                    Incentives: ${incentives}
                `);
            })
            .on('mousemove', function (event) {
                tooltip.style('left', `${event.pageX + 15}px`).style('top', `${event.pageY + 15}px`);
            })
            .on('mouseout', function () {
                tooltip.style('opacity', 0);
            })
            .on('click', function (event, d) {
                event.stopPropagation();
                const state = d.properties.NAME;

                // Récupérer les dates actuelles
                const currentStartDate = getStartDate();
                const currentEndDate = getEndDate();

                // Filtrer les stations par les dates actuelles
                const filteredStations = stationsByState[state]?.filter(station => {
                    const stationDate = new Date(station["Open Date"]);
                    return stationDate >= currentStartDate && stationDate <= currentEndDate;
                }) || [];

                toggleStateSelection(svg, state, filteredStations, projection);
            });

        setupZoom(svg, mapLayer, stationLayer, width, height);
    });
}
function updateMap(svg, salesResults, stationsCount, incentivesCount, stationsByState) {
    const currentStartDate = getStartDate();
    const currentEndDate = getEndDate();

    svg.selectAll('path.state').each(function (d) {
        const state = d.properties.NAME;

        const evSales = (salesResults.evData && salesResults.evData[state]) || 0;
        const hevSales = (salesResults.hevData && salesResults.hevData[state]) || 0;
        const phevSales = (salesResults.phevData && salesResults.phevData[state]) || 0;
        const stations = stationsByState[state]?.filter(station => {
            const stationDate = new Date(station["Open Date"]);
            return stationDate >= currentStartDate && stationDate <= currentEndDate;
        }).length || 0;

        // Mettre à jour les attributs des états avec les nouvelles données
        d3.select(this)
            .attr('data-ev-sales', evSales)
            .attr('data-hev-sales', hevSales)
            .attr('data-phev-sales', phevSales)
            .attr('data-stations', stations)
            .attr('data-incentives', incentivesCount[state] || 0);
    });

    // Si un état est actif, mettre à jour ses stations
    if (activeState) {
        const stationLayer = svg.select('.stations-layer');
        const filteredStations = stationsByState[activeState]?.filter(station => {
            const stationDate = new Date(station["Open Date"]);
            return stationDate >= currentStartDate && stationDate <= currentEndDate;
        }) || [];

        updateStationsForState(activeState, filteredStations);
    }

    // Ajouter ou mettre à jour le gestionnaire de tooltip
    svg.selectAll('path.state')
        .on('mouseover', function (event, d) {
            const state = d.properties.NAME;

            const evSales = d3.select(this).attr('data-ev-sales') || 0;
            const hevSales = d3.select(this).attr('data-hev-sales') || 0;
            const phevSales = d3.select(this).attr('data-phev-sales') || 0;
            const stations = d3.select(this).attr('data-stations') || 0;
            const incentives = d3.select(this).attr('data-incentives') || 0;

            d3.select('.tooltip')
                .style('opacity', 1)
                .html(`
                    <strong>${state}</strong><br>
                    EV: ${evSales}<br>
                    HEV: ${hevSales}<br>
                    PHEV: ${phevSales}<br>
                    Charging stations: ${stations}<br>
                    Incentives: ${incentives}
                `);
        })
        .on('mousemove', function (event) {
            d3.select('.tooltip')
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY + 15}px`);
        })
        .on('mouseout', function () {
            d3.select('.tooltip').style('opacity', 0);
        });
}



function toggleStateSelection(svg, state, stations, projection) {
    const stationLayer = svg.select('.stations-layer');
    const currentTransform = d3.zoomTransform(svg.node());

    if (activeState === state) {
        activeState = null;
        updateSelectedState(null);
        stationLayer.selectAll('circle').remove();
        svg.selectAll('path').attr('fill', '#4a90e2');
    } else {
        activeState = state;
        updateSelectedState(activeState);
        svg.selectAll('path').attr('fill', d =>
            d.properties.NAME === state ? '#ffcc00' : '#4a90e2'
        );

        stationLayer.selectAll('circle').remove();

        stationLayer.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('cx', d => {
                if (!d.Longitude || !d.Latitude) return null;
                const projected = projection([d.Longitude, d.Latitude]);
                return projected ? projected[0] : null;
            })
            .attr('cy', d => {
                if (!d.Longitude || !d.Latitude) return null;
                const projected = projection([d.Longitude, d.Latitude]);
                return projected ? projected[1] : null;
            })
            .attr('r', 3.5 / currentTransform.k)
            .attr('fill', 'red')
            .attr('stroke', 'black')
            .attr('stroke-width', 1 / currentTransform.k);
    }

    if (onStateSelectionChange) {
        onStateSelectionChange(activeState);
    }
}

function deselectState(svg, stationLayer) {
    activeState = null;

    svg.selectAll('.state').attr('fill', '#4a90e2');
    stationLayer.selectAll('circle').remove();
}

function setupZoom(svg, mapLayer, stationLayer, width, height) {
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
            const transform = event.transform;

            mapLayer.attr('transform', transform);
            stationLayer.attr('transform', transform);

            stationLayer.selectAll('circle')
                .attr('r', 3.5 / transform.k)
                .attr('stroke-width', 1 / transform.k);
        });

    svg.call(zoom);
}

function updateStationsForState(state, filteredStations) {
    const svg = d3.select('.map svg');
    const stationLayer = svg.select('.stations-layer');
    const currentTransform = d3.zoomTransform(svg.node());

    stationLayer.selectAll('circle').remove();

    stationLayer.selectAll('circle')
        .data(filteredStations)
        .enter()
        .append('circle')
        .attr('cx', d => {
            if (!d.Longitude || !d.Latitude) return null;
            const projected = projection([d.Longitude, d.Latitude]);
            return projected ? projected[0] : null;
        })
        .attr('cy', d => {
            if (!d.Longitude || !d.Latitude) return null;
            const projected = projection([d.Longitude, d.Latitude]);
            return projected ? projected[1] : null;
        })
        .attr('r', 3.5 / currentTransform.k)
        .attr('fill', 'red')
        .attr('stroke', 'black')
        .attr('stroke-width', 1 / currentTransform.k);
}
