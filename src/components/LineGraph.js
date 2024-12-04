import * as d3 from 'd3';
import { calculateSalesByMonthForState, calculateTotalSalesByMonth, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';
import {filterStationsForState,filterStationsByState}from '../utils/dataLoaders/chargingStationsLoader';
let salesData = null;
let stationsData = null;


(async () => {
    try {
        salesData = await loadSalesData();
        renderLineGraph(getStartDate(),getEndDate());
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

    const formattedData = formatAllDataForLine(salesDataToPlot);

    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedData, (d) => d.date))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(formattedData, (d) => d.value)])
        .range([height - 50, 50]);

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(50, 0)')
        .call(d3.axisLeft(yScale));

    plotLines(svg, salesDataToPlot, xScale, yScale);
}



function updateLineGraph(svg, startDate, endDate, width, height) {
    const selectedState = getSelectedState();
    let salesDataToPlot = selectedState
        ? calculateSalesByMonthForState(startDate, endDate, selectedState, salesData)
        : calculateTotalSalesByMonth(startDate, endDate, salesData);

    const formattedData = formatAllDataForLine(salesDataToPlot);

    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedData, (d) => d.date))
        .range([50, width - 50]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(formattedData, (d) => d.value)])
        .range([height - 50, 50]);

    svg.select('.x-axis')
        .attr('transform', `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.select('.y-axis')
        .call(d3.axisLeft(yScale));

    plotLines(svg, salesDataToPlot, xScale, yScale);
}


function plotLines(svg, salesDataToPlot, xScale, yScale) {
    svg.selectAll('.line-path').remove();
    const colors = {
        evData: 'red',
        hevData: 'green',
        phevData: 'blue',
    };

    for (const type in salesDataToPlot) {
        const lineData = formatDataForLine(salesDataToPlot[type]);

        if (lineData.length === 0) {
            console.warn(`No data for line type: ${type}`);
            continue;
        }


        const lineGenerator = d3.line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.value));

        svg.append('path')
            .datum(lineData)
            .attr('class', 'line-path') 
            .attr('fill', 'none')
            .attr('stroke', colors[type])
            .attr('stroke-width', 2)
            .attr('d', lineGenerator);
    }
}


function formatDataForLine(data) {
    const formattedData = [];
    for (const year in data) {
        for (const month in data[year]) {
            const monthIndex = getMonthNumber(month); // Récupérer l'index du mois (0-based)
            formattedData.push({
                date: new Date(year, monthIndex, 1),
                value: data[year][month],
            });
        }
    }
    return formattedData.sort((a, b) => a.date - b.date);
}

function formatAllDataForLine(salesData) {
    const formattedData = [];
    for (const type in salesData) {
        formattedData.push(...formatDataForLine(salesData[type]));
    }
    return formattedData;
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
