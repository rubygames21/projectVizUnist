import * as d3 from 'd3';
import { calculateSalesByState, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStationsCountByState, getStationsByState } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesCountByState } from '../utils/dataLoaders/incentivesLoader';
import { renderLineGraph } from './LineGraph';
import { getStartDate, getEndDate, setSelectedState, getSelectedState } from './stateManager'; // Import des dates dynamiques
import { renderIncentivesList } from './IncentivesList';
import { getFilters } from './FilterManager';

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
    const filters = getFilters(); // Récupérer les filtres actifs

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
    updateGlobalTooltip(salesResults, stationsCount, incentivesCount, filters);

}

function initializeMap(salesResults, stationsCount, incentivesCount, stationsByState) {
    const container = d3.select('.map');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    projection = d3.geoAlbersUsa()
        .translate([width / 2+25, height / 2-30])
        .scale(Math.min(width, height) * 1.8);

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
            .attr('fill', '#6B9EFF')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('class', 'state')
            .on('mouseover', function (event, d) {
                const filters = getFilters(); 
                const state = d.properties.NAME;

                const evSales = filters.EV_sales ? (salesResults.evData[state] || 0) : null;
                const hevSales = filters.HEV_sales ? (salesResults.hevData[state] || 0) : null;
                const phevSales = filters.PHEV_sales ? (salesResults.phevData[state] || 0) : null;
                const stations = filters.stations ? (stationsCount[state] || 0) : null;
                const incentives = filters.incentives ? (incentivesCount[state] || 0) : null;

                const tooltipContent = buildTooltipContent(state, evSales, hevSales, phevSales, stations, incentives);
                tooltip.style('opacity', 1).html(tooltipContent);
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
                const filters = getFilters();

                if (activeState === state) {
                    deselectState(svg, stationLayer);
                } else {
                    const currentStartDate = getStartDate();
                    const currentEndDate = getEndDate();

                    const filteredStations = filters.stations
                        ? stationsByState[state]?.filter(station => {
                              const stationDate = new Date(station["Open Date"]);
                              return stationDate >= currentStartDate && stationDate <= currentEndDate;
                          }) || []
                        : []; // Pas de stations si le filtre est décoché

                    toggleStateSelection(svg, state, filteredStations, projection);
                }
            });

        setupZoom(svg, mapLayer, stationLayer, width, height);
    });

    // Ajouter le tooltip global
    const globalTooltip = d3.select('.map')
        .append('div')
        .attr('class', 'global-tooltip')
        .style('position', 'absolute')
        .style('top', '14vh') // Position initiale
        .style('right', '53vw') // Position initiale
        .style('padding', '10px')
        .style('background', 'rgba(128, 128, 128, 0.7)')
        .style('border-radius', '5px')
        .style('font-size', '1.1rem')
        .style('pointer-events', 'auto') // Permet les interactions
        .style('opacity', 1)
        .html(`<strong>Total USA Data</strong><br>Calculating...`);

    
    let startX, startY, offsetX, offsetY;

    globalTooltip
        .on('mousedown', function (event) {
            event.preventDefault();
            const rect = this.getBoundingClientRect();
            startX = event.clientX;
            startY = event.clientY;
            offsetX = rect.left;
            offsetY = rect.top;

            d3.select(window)
                .on('mousemove', onDrag)
                .on('mouseup', onStop);
        });

    function onDrag(event) {
        event.preventDefault();
        const newLeft = offsetX + (event.clientX - startX);
        const newTop = offsetY + (event.clientY - startY);

        const containerRect = container.node().getBoundingClientRect();
        const tooltipRect = globalTooltip.node().getBoundingClientRect();

        // Contraindre le tooltip à rester dans les limites de la carte
        const constrainedLeft = Math.max(
            containerRect.left+42//gauche
            ,
            Math.min(containerRect.right - tooltipRect.width -5 , newLeft-5)//droite
        );
        const constrainedTop = Math.max(
            containerRect.top+150//haut
            ,
            Math.min(containerRect.bottom - tooltipRect.height +95, newTop+95)
        );

        globalTooltip.style('left', `${constrainedLeft - containerRect.left}px`);
        globalTooltip.style('top', `${constrainedTop - containerRect.top}px`);
    }

    function onStop() {
        d3.select(window)
            .on('mousemove', null)
            .on('mouseup', null);
    }
}



function updateMap(svg, salesResults, stationsCount, incentivesCount, stationsByState) {
    const filters = getFilters(); // Récupérer les filtres
    const currentStartDate = getStartDate();
    const currentEndDate = getEndDate();

    svg.selectAll('path.state').each(function (d) {
        const state = d.properties.NAME;

        const evSales = filters.EV_sales ? (salesResults.evData[state] || 0) : null;
        const hevSales = filters.HEV_sales ? (salesResults.hevData[state] || 0) : null;
        const phevSales = filters.PHEV_sales ? (salesResults.phevData[state] || 0) : null;
        const stations = filters.stations
            ? stationsByState[state]?.filter(station => {
                  const stationDate = new Date(station["Open Date"]);
                  return stationDate >= currentStartDate && stationDate <= currentEndDate;
              }).length || 0
            : null;
        const incentives = filters.incentives ? (incentivesCount[state] || 0) : null;

        d3.select(this)
            .attr('data-ev-sales', evSales)
            .attr('data-hev-sales', hevSales)
            .attr('data-phev-sales', phevSales)
            .attr('data-stations', stations)
            .attr('data-incentives', incentives);
    });

    svg.selectAll('path.state')
        .on('mouseover', function (event, d) {
            const state = d.properties.NAME;

            const evSales = d3.select(this).attr('data-ev-sales') !== "null" ? d3.select(this).attr('data-ev-sales') : null;
            const hevSales = d3.select(this).attr('data-hev-sales') !== "null" ? d3.select(this).attr('data-hev-sales') : null;
            const phevSales = d3.select(this).attr('data-phev-sales') !== "null" ? d3.select(this).attr('data-phev-sales') : null;
            const stations = d3.select(this).attr('data-stations') !== "null" ? d3.select(this).attr('data-stations') : null;
            const incentives = d3.select(this).attr('data-incentives')  !== "null" ? d3.select(this).attr('data-incentives') : null;;

            const tooltipContent = buildTooltipContent(state, evSales, hevSales, phevSales, stations, incentives);
            d3.select('.tooltip').style('opacity', 1).html(tooltipContent);
        })
        .on('mousemove', function (event) {
            d3.select('.tooltip')
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY + 15}px`);
        })
        .on('mouseout', function () {
            d3.select('.tooltip').style('opacity', 0);
        });

    if (activeState) {
        const stationLayer = svg.select('.stations-layer');
        const filteredStations = filters.stations
            ? stationsByState[activeState]?.filter(station => {
                  const stationDate = new Date(station["Open Date"]);
                  return stationDate >= currentStartDate && stationDate <= currentEndDate;
              }) || []
            : []; // Pas de stations si le filtre est décoché

        updateStationsForState(activeState, filteredStations);
    }
    updateGlobalTooltip(salesResults, stationsCount, incentivesCount, filters);
}




function deselectState(svg, stationLayer) {
    activeState = null;

    setSelectedState(null)
    svg.selectAll('.state').attr('fill', '#6B9EFF');
    stationLayer.selectAll('circle').remove();

    d3.select('.global-tooltip').style('opacity', 1);

    renderLineGraph(getStartDate(), getEndDate());
    renderIncentivesList(getStartDate(),getEndDate()) // Réinitialiser le graphique
}


function toggleStateSelection(svg, state, stations, projection) {
    const filters = getFilters(); // Récupérer les filtres
    const stationLayer = svg.select('.stations-layer');
    const currentTransform = d3.zoomTransform(svg.node());

    if (activeState === state) {
        activeState = null;
        setSelectedState(null);
        stationLayer.selectAll('circle').remove();
        svg.selectAll('path').attr('fill', '#6B9EFF');

        d3.select('.global-tooltip').style('opacity',1);
        renderLineGraph(getStartDate(), getEndDate());
        renderIncentivesList(getStartDate(), getEndDate());
    } else {
        activeState = state;
        setSelectedState(state);
        svg.selectAll('path').attr('fill', d =>
            d.properties.NAME === state ? '#387CFF' : '#6B9EFF'
        );
        stationLayer.selectAll('circle').remove();

        if (filters.stations) {
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
                .attr('fill', 'orange')
                .attr('stroke', 'black')
                .attr('stroke-width', 1 / currentTransform.k);
        }
        d3.select('.global-tooltip').style('opacity', 0);

        renderLineGraph(getStartDate(), getEndDate());
        renderIncentivesList(getStartDate(), getEndDate());
    }

    if (onStateSelectionChange) {
        onStateSelectionChange(activeState);
    }
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
        .attr('fill', 'orange')
        .attr('stroke', 'black')
        .attr('stroke-width', 1 / currentTransform.k);
}

// Construction du contenu du tooltip pour un état
function buildTooltipContent(state, evSales, hevSales, phevSales, stations, incentives) {
    let tooltipContent = `<strong>${state}</strong><br>`;
    if (evSales !== null) tooltipContent += `BEV: ${evSales}<br>`;
    if (hevSales !== null) tooltipContent += `HEV: ${hevSales}<br>`;
    if (phevSales !== null) tooltipContent += `PHEV: ${phevSales}<br>`;
    if (stations !== null) tooltipContent += `Charging stations: ${stations}<br>`;
    if (incentives !== null) tooltipContent += `Incentives: ${incentives}<br>`;
    return tooltipContent;
}

function updateGlobalTooltip(salesResults, stationsCount, incentivesCount, filters) {
    const { totalEVSales, totalHEVSales, totalPHEVSales, totalStations, totalIncentives } =
        calculateGlobalTotals(salesResults, stationsCount, incentivesCount, filters);

    // Construire le contenu du tooltip
    const tooltipContent = `
        <strong>Total USA Data</strong><br>
        ${filters.EV_sales ? `BEV Sales: ${totalEVSales}<br>` : ''}
        ${filters.HEV_sales ? `HEV Sales: ${totalHEVSales}<br>` : ''}
        ${filters.PHEV_sales ? `PHEV Sales: ${totalPHEVSales}<br>` : ''}
        ${filters.stations ? `Charging Stations: ${totalStations}<br>` : ''}
        ${filters.incentives ? `Incentives: ${totalIncentives}<br>` : ''}
    `;

    const globalTooltip = d3.select('.global-tooltip');
    globalTooltip.html(tooltipContent);

    // Mesurer les dimensions du contenu réel
    const tooltipNode = globalTooltip.node();

    // Utiliser scrollWidth et scrollHeight pour ajuster automatiquement
    const contentWidth = tooltipNode.scrollWidth;
    const contentHeight = tooltipNode.scrollHeight;

    // Appliquer les dimensions au tooltip
    globalTooltip
        .style('width', `${contentWidth-20}px`)
        .style('height', `${contentHeight-20}px`)
        .style('min-width', '150px') // Taille minimale pour éviter une largeur trop petite
        .style('min-height', '50px') // Taille minimale pour éviter une hauteur trop petite
        .style('padding', filters.EV_sales || filters.HEV_sales || filters.PHEV_sales || filters.stations || filters.incentives ? '10px' : '0') // Ajuste le padding
        .style('background', filters.EV_sales || filters.HEV_sales || filters.PHEV_sales || filters.stations || filters.incentives ? 'rgba(128, 128, 128, 0.7)' : 'transparent') // Enlever le fond si vide
        .style('border-radius', filters.EV_sales || filters.HEV_sales || filters.PHEV_sales || filters.stations || filters.incentives ? '5px' : '0'); // Ajuste le rayon des coins
}




// Calcul des totaux globaux
function calculateGlobalTotals(salesResults, stationsCount, incentivesCount, filters) {
    let totalEVSales = 0, totalHEVSales = 0, totalPHEVSales = 0, totalStations = 0, totalIncentives = 0;

    Object.keys(salesResults.evData).forEach(state => {
        if (filters.EV_sales) totalEVSales += salesResults.evData[state] || 0;
        if (filters.HEV_sales) totalHEVSales += salesResults.hevData[state] || 0;
        if (filters.PHEV_sales) totalPHEVSales += salesResults.phevData[state] || 0;
    });

    if (filters.stations) {
        Object.values(stationsCount).forEach(count => totalStations += count || 0);
    }
    if (filters.incentives){
        Object.values(incentivesCount).forEach(count => totalIncentives += count || 0);
    }

    return { totalEVSales, totalHEVSales, totalPHEVSales, totalStations, totalIncentives };
}
