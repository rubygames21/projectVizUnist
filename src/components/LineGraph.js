import * as d3 from 'd3';
import { calculateSalesByMonthForState, calculateTotalSalesByMonth, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';
import { filterDataByDateRange, filterDataByDateRangeForState } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesDetailsForState, getIncentivesDetailsByState } from '../utils/dataLoaders/incentivesLoader';
import { setFilter, getFilters } from './FilterManager';

let salesData = null;
let stationsData = null;
let incentivesData = null;
let filters = null;

(async () => {
    try {
        salesData = await loadSalesData();

        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData = await incentivesResponse.json();

        const stationsResponse = await fetch('/data/stations_cumulative.json');
        if (!stationsResponse.ok) throw new Error(`Erreur HTTP Stations: ${stationsResponse.status}`);
        stationsData = await stationsResponse.json();

        renderLineGraph(getStartDate(), getEndDate());
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
})();

export function renderLineGraph(startDate = getStartDate(), endDate = getEndDate()) {
    if (!salesData) {
        console.error('Les données ne sont pas encore chargées.');
        return;
    }
    filters = getFilters(); // Récupérer les filtres

    renderLegend(filters); // Mettre à jour la légende dynamiquement
    const container = d3.select('.linegraph');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const svg = container.select('svg');
    if (svg.empty()) {
        initializeLineGraph(svg, startDate, endDate, width, height,filters);
    } else {
        updateLineGraph(svg, startDate, endDate, width, height,filters);
    }
}

function initializeLineGraph(svg, startDate, endDate, width, height, filters) {
    const container = d3.select('.linegraph');
    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    const selectedState = getSelectedState();
    let salesDataToPlot = selectedState
        ? calculateSalesByMonthForState(startDate, endDate, selectedState, salesData)
        : calculateTotalSalesByMonth(startDate, endDate, salesData);

    let chargingStationsToPlot = selectedState
        ? filterDataByDateRangeForState(stationsData, selectedState, startDate, endDate)
        : filterDataByDateRange(stationsData, startDate, endDate);

    let incentivesToPlot = selectedState
        ? getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate)
        : getIncentivesDetailsByState(incentivesData, startDate, endDate);

    const formattedSalesData = formatAllDataForLine(salesDataToPlot);
    const formattedStationsData = formatDataForStationLine(chargingStationsToPlot);

    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedSalesData, (d) => d.date))
        .range([90, width - 90]);

    const yScaleSales = d3.scaleLinear()
        .domain([0, d3.max(formattedSalesData, (d) => d.value)])
        .range([height - 40, 0]); // Ajusté pour synchroniser avec l'axe X

    const yScaleStations = d3.scaleLinear()
        .domain([0, d3.max(formattedStationsData, (d) => d.value)])
        .range([height - 40, 0]); // Ajusté pour synchroniser avec l'axe X

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - 40})`) // Ajusté pour l'alignement
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.append('g')
        .attr('class', 'y-axis-sales')
        .attr('transform', 'translate(90, 0)')
        .call(d3.axisLeft(yScaleSales));

    if (filters.stations) {
        svg.append('g')
            .attr('class', 'y-axis-stations')
            .attr('transform', `translate(${width - 90}, 0)`)
            .style('color', 'orange')
            .call(d3.axisRight(yScaleStations));
        plotChargingStationLines(svg, chargingStationsToPlot, xScale, yScaleStations);
    } else {
        svg.selectAll('.station-line-path').remove();
        svg.selectAll('.y-axis-stations').remove();
    }

    if (filters.EV_sales || filters.HEV_sales || filters.PHEV_sales) {
        plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales, filters);
    } else {
        svg.selectAll('.line-path').remove();
    }

    if (filters.incentives) {
        plotIncentives(svg, incentivesToPlot, xScale, height);
    }
}

function updateLineGraph(svg, startDate, endDate, width, height, filters) {
    const selectedState = getSelectedState();
    let salesDataToPlot = selectedState
        ? calculateSalesByMonthForState(startDate, endDate, selectedState, salesData)
        : calculateTotalSalesByMonth(startDate, endDate, salesData);

    let chargingStationsToPlot = selectedState
        ? filterDataByDateRangeForState(stationsData, selectedState, startDate, endDate)
        : filterDataByDateRange(stationsData, startDate, endDate);

    let incentivesToPlot = selectedState
        ? getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate)
        : getIncentivesDetailsByState(incentivesData, startDate, endDate);

    const formattedSalesData = formatAllDataForLine(salesDataToPlot);
    const formattedStationsData = formatDataForStationLine(chargingStationsToPlot);

    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedSalesData, (d) => d.date))
        .range([90, width - 90]);

    const yScaleSales = d3.scaleLinear()
        .domain([0, d3.max(formattedSalesData, (d) => d.value)])
        .range([height - 40, 0]); // Ajusté pour synchroniser avec l'axe X

    const yScaleStations = d3.scaleLinear()
        .domain([0, d3.max(formattedStationsData, (d) => d.value)])
        .range([height - 40, 0]); // Ajusté pour synchroniser avec l'axe X

    svg.select('.x-axis')
        .attr('transform', `translate(0, ${height - 40})`) // Ajusté pour l'alignement
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.select('.y-axis-sales')
        .call(d3.axisLeft(yScaleSales));

    if (filters.stations) {
        svg.selectAll('.y-axis-stations').remove();

        svg.append('g')
            .attr('class', 'y-axis-stations')
            .attr('transform', `translate(${width - 90}, 0)`)
            .style('color', 'orange')
            .call(d3.axisRight(yScaleStations));
        plotChargingStationLines(svg, chargingStationsToPlot, xScale, yScaleStations);
    } else {
        svg.selectAll('.station-line-path').remove();
        svg.selectAll('.y-axis-stations').remove();
    }

    if (filters.EV_sales || filters.HEV_sales || filters.PHEV_sales) {
        plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales, filters);
    } else {
        svg.selectAll('.line-path').remove();
    }

    if (filters.incentives) {
        plotIncentives(svg, incentivesToPlot, xScale, height);
    }
}


function plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales, filters) {
    svg.selectAll('.line-path').remove();
    const colors = { evData: '#34C759', hevData: '#007AFF', phevData: '#40e0d0' };

    for (const type in salesDataToPlot) {
        if (
            (type === 'evData' && !filters.EV_sales) ||
            (type === 'hevData' && !filters.HEV_sales) ||
            (type === 'phevData' && !filters.PHEV_sales)
        ) {
            continue; // Sauter les types de ventes décochés
        }

        const lineData = formatDataForSalesLine(salesDataToPlot[type]);

        if (lineData.length === 0) continue;

        const lineGenerator = d3.line()
            .x((d) => xScale(d.date))
            .y((d) => yScaleSales(d.value));

        svg.append('path')
            .datum(lineData)
            .attr('class', 'line-path')
            .attr('fill', 'none')
            .attr('stroke', colors[type])
            .attr('stroke-width', 2)
            .attr('d', lineGenerator);
    }
}


function plotChargingStationLines(svg, chargingStationsToPlot, xScale, yScaleStations) {
    svg.selectAll('.station-line-path').remove();

    const lineData = formatDataForStationLine(chargingStationsToPlot);

    if (lineData.length === 0) {
        console.warn('No data for charging stations');
        return;
    }

    const lineGenerator = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScaleStations(d.value));

    svg.append('path')
        .datum(lineData)
        .attr('class', 'station-line-path')
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 2)
        .attr('d', lineGenerator);
}

function plotIncentives(svg, incentivesToPlot, xScale, height) {
    svg.selectAll('.incentive-line').remove();

    // Déterminer les limites de l'axe X
    const xDomain = xScale.domain(); // [startDate, endDate]
    const startX = xScale(xDomain[0]);
    const endX = xScale(xDomain[1]);

    Object.values(incentivesToPlot).flat().forEach((incentive) => {
        const incentiveDate = new Date(incentive.Date);
        const xPosition = xScale(incentiveDate);

        // Vérifier si la date est dans les limites de l'axe X
        if (xPosition >= startX && xPosition <= endX) {
            svg.append('line')
                .attr('class', 'incentive-line')
                .attr('x1', xPosition)
                .attr('y1', 0)
                .attr('x2', xPosition)
                .attr('y2', height - 40) // Ajuster pour correspondre à l'axe X
                .style('stroke', '#FF3B30')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '4 2')
                .style('opacity', '0.35');
        }
    });
}


function formatDataForStationLine(data) {
    return Object.entries(data).flatMap(([year, months]) =>
        Object.entries(months).map(([month, value]) => ({
            date: new Date(year, getMonthNumberEn(month), 1),
            value,
        }))
    ).sort((a, b) => a.date - b.date);
}

function formatDataForSalesLine(data) {
    return Object.entries(data).flatMap(([year, months]) =>
        Object.entries(months).map(([month, value]) => ({
            date: new Date(year, getMonthNumber(month), 1),
            value,
        }))
    ).sort((a, b) => a.date - b.date);
}

function formatAllDataForLine(salesData) {
    return Object.values(salesData).flatMap(formatDataForSalesLine);
}

function getMonthNumber(monthName) {
    const months = {
        janvier: 0,
        février: 1,
        mars: 2,
        avril: 3,
        mai: 4,
        juin: 5,
        juillet: 6,
        août: 7,
        septembre: 8,
        octobre: 9,
        novembre: 10,
        décembre: 11,
    };
    return months[monthName];
}

function getMonthNumberEn(monthName) {
    const months = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
    };
    return months[monthName.toLowerCase()]; // Convertir en minuscule pour éviter les erreurs de casse
}

function renderLegend(filters) {
    const legendContainer = d3.select('.linegraph-legend');
    legendContainer.html(''); // Réinitialise la légende

    const legendData = [
        { key: 'EV_sales', label: 'BEV', color: '#34C759' },
        { key: 'PHEV_sales', label: 'PHEV', color: '#40e0d0' },
        { key: 'HEV_sales', label: 'HEV', color: '#007AFF' },
        { key: 'stations', label: 'Stations', color: 'orange' },
        { key: 'incentives', label: 'Incentives', color: '#FF3B30', dashed: true }
    ];

    // Filtrer les éléments en fonction des filtres actifs
    const activeLegendData = legendData.filter(item => filters[item.key]);

    // Ajouter chaque élément de la légende
    activeLegendData.forEach(item => {
        const legendItem = legendContainer.append('div')
            .attr('class', 'legend-item')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-bottom', '5px');

        // Ajouter la ligne de la légende
        legendItem.append('div')
            .style('width', '30px')
            .style('height', item.dashed ? '0' : '5px') // Pas de hauteur pour les pointillés
            .style('margin-right', '20px')
            .style('background-color', item.dashed ? 'transparent' : item.color) // Pas de couleur si pointillé
            .style('border-top', item.dashed ? `4px dashed ${item.color}` : 'none') // Ligne pointillée plus épaisse
            .style('border-width', item.dashed ? '4px' : '0'); // Largeur de la bordure pour les pointillés

        // Ajouter le texte
        legendItem.append('span')
            .text(item.label)
            .style('color', item.color);
    });

    legendContainer.style('margin-top', '-10px'); // Ajuste l'espace sous le graphique
}
