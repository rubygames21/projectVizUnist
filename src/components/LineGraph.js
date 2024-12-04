import * as d3 from 'd3';
import { calculateSalesByMonthForState, calculateTotalSalesByMonth, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';
import {filterStationsForState,filterStationsByState}from '../utils/dataLoaders/chargingStationsLoader';
import {getIncentivesDetailsForState, getIncentivesDetailsByState} from '../utils/dataLoaders/incentivesLoader';

let salesData = null;
let stationsData = null;
let incentivesData = null;

(async () => {
    try {
        salesData = await loadSalesData();


        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData= await incentivesResponse.json();

        const stationsResponse = await fetch('/data/stations_par_etat.json');
        if (!stationsResponse.ok) throw new Error(`Erreur HTTP Stations: ${stationsResponse.status}`);
        stationsData = await stationsResponse.json();

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

    let incentivesToPlot = selectedState
        ? getIncentivesDetailsForState(incentivesData,selectedState,startDate,endDate)
        : getIncentivesDetailsByState(incentivesData,startDate,endDate);
    
    console.log(incentivesToPlot)    

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

    plotSalesLines(svg, salesDataToPlot, xScale, yScale);
    plotIncentives(svg, incentivesToPlot, xScale, height);
}



function updateLineGraph(svg, startDate, endDate, width, height) {
    const selectedState = getSelectedState();
    let salesDataToPlot = selectedState
        ? calculateSalesByMonthForState(startDate, endDate, selectedState, salesData)
        : calculateTotalSalesByMonth(startDate, endDate, salesData);

    let incentivesToPlot = selectedState
        ? getIncentivesDetailsForState(incentivesData,selectedState,startDate,endDate)
        : getIncentivesDetailsByState(incentivesData,startDate,endDate);

    console.log(incentivesToPlot)        
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

    plotSalesLines(svg, salesDataToPlot, xScale, yScale);
    plotIncentives(svg, incentivesToPlot, xScale, height);
}


function plotSalesLines(svg, salesDataToPlot, xScale, yScale) {
    svg.selectAll('.line-path').remove();
    const colors = {
        evData: 'red',
        hevData: 'green',
        phevData: 'blue',
    };
    for (const type in salesDataToPlot) {
        const lineData = formatDataForSalesLine(salesDataToPlot[type]);

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

function plotIncentives(svg, incentivesToPlot, xScale, height) {
    // Supprimer les lignes existantes pour éviter les doublons
    svg.selectAll('.incentive-line').remove();

    

    // Si incentivesToPlot est un objet (aucun état sélectionné)
    if (typeof incentivesToPlot === 'object') {
        Object.values(incentivesToPlot).flat().forEach((incentive) => {
            const incentiveDate = new Date(incentive.Date);
            svg.append('line')
                .attr('class', 'incentive-line')
                .attr('x1', xScale(incentiveDate))
                .attr('y1', 50) // Position de départ de la ligne
                .attr('x2', xScale(incentiveDate))
                .attr('y2', height - 50) // Position de fin de la ligne
                .style('stroke', 'purple')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '4 2'); // Ligne pointillée
        });
    }
}

function formatDataForSalesLine(data) {
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
        formattedData.push(...formatDataForSalesLine(salesData[type]));
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
