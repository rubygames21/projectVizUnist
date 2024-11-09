import * as d3 from 'd3';
import { loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { loadChargingStations } from '../utils/dataLoaders/chargingStationsLoader';
import { updateLineChartData } from './LineGraph';

const stateNameMap = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia"
};

let selectedStartDate = new Date(2016, 0, 1);
let selectedEndDate = new Date(2023, 0, 1);
let activeState = null;

// Fonction pour mettre à jour les dates de la timeline et filtrer les données pour le graphique de ligne
export function updateTimelineDates(startDate, endDate) {
    selectedStartDate = startDate;
    selectedEndDate = endDate;
    updateFilteredData();
}

// Fonction pour mettre à jour l'état actif et filtrer les données pour le graphique de ligne
function updateSelectedState(state) {
    activeState = (activeState === state) ? null : state;
    updateFilteredData();
}

// Filtre les données des stations par état et par date pour le graphique de ligne
function updateFilteredData() {
    loadChargingStations().then(stations => {
        const filteredStations = stations.filter(station => {
            const isInState = activeState ? station.properties.state === activeState : true;
            const isInDateRange = station.properties.openDate >= selectedStartDate && station.properties.openDate <= selectedEndDate;
            return isInState && isInDateRange;
        });

        // Transmettre les données filtrées au graphique de ligne
        updateLineChartData(filteredStations);
    });
}

// Fonction principale pour le rendu de la carte
export function renderMap() {
    const container = d3.select('.map');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(Math.min(width, height) * 2.2);

    const path = d3.geoPath().projection(projection);

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip');

    Promise.all([loadSalesData(), loadChargingStations()]).then(([salesData, stations]) => {
        const stationCountsByState = countStationsByState(stations);
        d3.json('/data/us-states.json').then(geoData => {
            drawMap(svg, geoData, path, tooltip, salesData, stationCountsByState, stations, projection);

            // Déclarer la couche des stations après le rendu de la carte
            const stationLayer = svg.append('g').attr('class', 'station-layer');

            setupZoom(svg, path, projection, geoData, tooltip, salesData, stations, stationLayer);
        });
    });
}

// Fonction pour calculer le nombre de stations par état
function countStationsByState(stations) {
    return stations.reduce((counts, station) => {
        const stateAbbr = station.properties.state;
        const stateName = stateNameMap[stateAbbr] || stateAbbr;
        counts[stateName] = (counts[stateName] || 0) + 1;
        return counts;
    }, {});
}

// Fonction pour dessiner la carte et gérer le clic sur les états
function drawMap(svg, data, path, tooltip, salesData, stationCountsByState, stations, projection) {
    svg.selectAll('path')
        .data(data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#4a90e2')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('fill', '#ffcc00');
            const state = d.properties.NAME;
            const evSales = salesData.EV[state] ? salesData.EV[state]['2023'] : 'N/A';
            const stationCount = stationCountsByState[state] || 0;

            tooltip
                .style('opacity', 1)
                .html(`<strong>${state}</strong><br> EV Sales: ${evSales}<br> Charging Stations: ${stationCount}`);
        })
        .on('mousemove', function(event) {
            const [x, y] = d3.pointer(event);
            tooltip
                .style('left', `${x + 15}px`)
                .style('top', `${y + 15}px`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('fill', '#4a90e2');
            tooltip.style('opacity', 0);
        })
        .on('click', function(event, d) {
            event.stopPropagation();
            const state = d.properties.NAME;
            updateSelectedState(state);
            displayStationsForState(svg.select('.station-layer'), stations, state, projection);
        });

    svg.on('click', () => {
        if (activeState) {
            updateSelectedState(null);
            hideStations(svg.select('.station-layer'));
        }
    });
}

// Fonction pour afficher les stations d'un état spécifique en fonction des dates sélectionnées
function displayStationsForState(layer, stations, state, projection, scale = 1) {
    hideStations(layer);

    const filteredStations = stations.filter(station => {
        const isInState = station.properties.state === state;
        const isInDateRange = station.properties.openDate >= selectedStartDate && station.properties.openDate <= selectedEndDate;
        const hasValidCoordinates = station.geometry.coordinates[0] && station.geometry.coordinates[1];
        return isInState && isInDateRange && hasValidCoordinates;
    });

    layer.selectAll('circle')
        .data(filteredStations)
        .enter()
        .append('circle')
        .attr('cx', d => projection(d.geometry.coordinates)[0])
        .attr('cy', d => projection(d.geometry.coordinates)[1])
        .attr('r', 4 / scale)
        .attr('fill', 'red')
        .attr('stroke', '#000')
        .attr('stroke-width', 1);

    console.log("Stations affichées pour l'état et la période sélectionnés :", filteredStations);
}

// Fonction pour masquer toutes les stations
function hideStations(layer) {
    layer.selectAll('circle').remove();
}

// Fonction pour limiter la translation en fonction du niveau de zoom
function limitTranslate(transform, width, height) {
    const scale = transform.k;
    const xLimit = (width * scale - width) / 2;
    const yLimit = (height * scale - height) / 2;
    transform.x = Math.max(Math.min(transform.x, xLimit), width - width * scale);
    transform.y = Math.max(Math.min(transform.y, yLimit), height - height * scale);
    return transform;
}

// Configuration du zoom et de la transformation
function setupZoom(svg, path, projection, geoData, tooltip, salesData, stations, stationLayer) {
    const width = svg.attr('width');
    const height = svg.attr('height');

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            const transform = limitTranslate(event.transform, width, height);

            svg.selectAll('path').attr('transform', transform);
            stationLayer.attr('transform', transform);

            stationLayer.selectAll('circle').attr('r', 4 / transform.k).attr('stroke-width', 1 / transform.k);
        });

    svg.call(zoom);
}
