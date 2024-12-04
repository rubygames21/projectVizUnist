import * as d3 from 'd3';
import { calculateSalesByMonthForState, calculateTotalSalesByMonth, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';
import { filterDataByDateRange, filterDataByDateRangeForState } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesDetailsForState, getIncentivesDetailsByState } from '../utils/dataLoaders/incentivesLoader';

let salesData = null;
let stationsData = null;
let incentivesData = null;

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

    const container = d3.select('.linegraph');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const svg = container.select('svg');
    if (svg.empty()) {
        initializeLineGraph(svg, startDate, endDate, width, height);
    } else {
        updateLineGraph(svg, startDate, endDate, width, height);
    }
}

function initializeLineGraph(svg, startDate, endDate, width, height) {
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
    console.log(chargingStationsToPlot);
    let incentivesToPlot = selectedState
        ? getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate)
        : getIncentivesDetailsByState(incentivesData, startDate, endDate);

    const formattedSalesData = formatAllDataForLine(salesDataToPlot);
    const formattedStationsData = formatDataForStationLine(chargingStationsToPlot);

    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedSalesData, (d) => d.date))
        .range([50, width - 50]);

    const yScaleSales = d3.scaleLinear()
        .domain([0, d3.max(formattedSalesData, (d) => d.value)])
        .range([height - 50, 50]);

    const yScaleStations = d3.scaleLinear()
        .domain([0, d3.max(formattedStationsData, (d) => d.value)])
        .range([height - 50, 50]);

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.append('g')
        .attr('class', 'y-axis-sales')
        .attr('transform', 'translate(50, 0)')
        .call(d3.axisLeft(yScaleSales));

    svg.append('g')
        .attr('class', 'y-axis-stations')
        .attr('transform', `translate(${width - 50}, 0)`)
        .call(d3.axisRight(yScaleStations));

    plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales);
    plotChargingStationLines(svg, chargingStationsToPlot, xScale, yScaleStations);
    plotIncentives(svg, incentivesToPlot, xScale, height);
}

function updateLineGraph(svg, startDate, endDate, width, height) {
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
        .range([50, width - 50]);

    const yScaleSales = d3.scaleLinear()
        .domain([0, d3.max(formattedSalesData, (d) => d.value)])
        .range([height - 50, 50]);

    const yScaleStations = d3.scaleLinear()
        .domain([0, d3.max(formattedStationsData, (d) => d.value)])
        .range([height - 50, 50]);

    svg.select('.x-axis')
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.select('.y-axis-sales')
        .call(d3.axisLeft(yScaleSales));

    svg.select('.y-axis-stations')
        .call(d3.axisRight(yScaleStations))
        .style('color','orange');

    plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales);
    plotChargingStationLines(svg, chargingStationsToPlot, xScale, yScaleStations);
    plotIncentives(svg, incentivesToPlot, xScale, height);
}

function plotSalesLines(svg, salesDataToPlot, xScale, yScaleSales) {
    svg.selectAll('.line-path').remove();
    const colors = { evData: 'red', hevData: 'green', phevData: 'blue' };

    for (const type in salesDataToPlot) {
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
    console.log('Line Data for Stations:', lineData);

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

    if (typeof incentivesToPlot === 'object') {
        Object.values(incentivesToPlot).flat().forEach((incentive) => {
            const incentiveDate = new Date(incentive.Date);
            svg.append('line')
                .attr('class', 'incentive-line')
                .attr('x1', xScale(incentiveDate))
                .attr('y1', 50)
                .attr('x2', xScale(incentiveDate))
                .attr('y2', height - 50)
                .style('stroke', 'purple')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '4 2');
        });
    }
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