import * as d3 from 'd3';
import { calculateSalesByYearForState, calculateTotalSalesByYear, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStationsCountByStateInRange, getStationsCountForStateInRange } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesCountByState,getIncentivesDetailsForState } from '../utils/dataLoaders/incentivesLoader';
import { getStartDate, getEndDate } from './stateManager';

let salesData = null;
let selectedState = null;
let chargingData = null;
let incentivesData = null;

const defaultStartDate = new Date(2016, 0, 1);
const defaultEndDate = new Date(2024, 0, 1);

(async () => {
    try {
        salesData = await loadSalesData();

        const stationsResponse = await fetch('/data/stations_par_etat.json');
        if (!stationsResponse.ok) throw new Error(`Erreur HTTP Stations: ${stationsResponse.status}`);
        chargingData = await stationsResponse.json();

        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData = await incentivesResponse.json();

        console.log('Données chargées:', { salesData, chargingData, incentivesData });
        renderLineGraph(defaultStartDate, defaultEndDate);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
})();

export function updateSelectedState(state) {
    selectedState = state;
    console.log(`État sélectionné : ${selectedState || 'Tous les états'}`);
    renderLineGraph(getStartDate(), getEndDate());
}

export function renderLineGraph(startDate = getStartDate(), endDate = getEndDate()) {
    if (!salesData || !chargingData) {
        console.error('Les données ne sont pas encore chargées.');
        return;
    }

    const container = d3.select('.linegraph');
    const width = container.node().getBoundingClientRect().width || 800;
    const height = container.node().getBoundingClientRect().height || 400;

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

    const xScale = d3.scaleBand()
        .domain(d3.range(startDate.getFullYear(), endDate.getFullYear() + 1))
        .range([50, width - 50])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 800000])
        .range([height - 50, 50]);

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', 'translate(50, 0)')
        .call(d3.axisLeft(yScale));

    if (selectedState) {
        const stationsCount = getStationsCountForStateInRange(chargingData, startDate, endDate, selectedState);
        const salesCountForState = calculateSalesByYearForState(startDate,endDate,selectedState,salesData)
        const incentivesDetailsForState = getIncentivesDetailsForState(incentivesData,selectedState,startDate,endDate)
        console.log('getIncentivesDetailsForState : ',incentivesDetailsForState)
        //console.log(`Stations pour ${selectedState} entre ${startDate} et ${endDate} :`, stationsCount);
        //console.log(salesCountForState)
    } else {
        const stationsCountByState = getStationsCountByStateInRange(chargingData, startDate, endDate);
        const totalSalesByYear = calculateTotalSalesByYear(startDate,endDate,salesData)
        const IncentivesCountByState = getIncentivesCountByState(incentivesData,startDate,endDate)
        console.log('IncentivesCountByState : ',IncentivesCountByState)
        //console.log(totalSalesByYear)
        //console.log(`Stations pour tous les états entre ${startDate} et ${endDate} :`, stationsCountByState);

    }
}

// Mise à jour du graphique
function updateLineGraph(svg, startDate, endDate, width, height) {
    const xScale = d3.scaleBand()
        .domain(d3.range(startDate.getFullYear(), endDate.getFullYear() + 1))
        .range([50, width - 50])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 800000]) 
        .range([height - 50, 50]);

    svg.select('.x-axis')
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.select('.y-axis')
        .call(d3.axisLeft(yScale));

    if (selectedState) {
        const stationsCount = getStationsCountForStateInRange(chargingData, startDate, endDate, selectedState);
        const salesCountForState = calculateSalesByYearForState(startDate,endDate,selectedState,salesData)
        const incentivesDetailsForState = getIncentivesDetailsForState(incentivesData,selectedState,startDate,endDate)
        //console.log('getIncentivesDetailsForState : ',incentivesDetailsForState)
        //console.log(`Stations pour ${selectedState} entre ${startDate} et ${endDate} :`, stationsCount);
        //console.log(salesCountForState)
    } else {
        const stationsCountByState = getStationsCountByStateInRange(chargingData, startDate, endDate);
        const totalSalesByYear = calculateTotalSalesByYear(startDate,endDate,salesData)
        const IncentivesCountByState = getIncentivesCountByState(incentivesData,startDate,endDate)
        //console.log('IncentivesCountByState : ',IncentivesCountByState)
        //console.log(totalSalesByYear)
        //console.log(`Stations pour tous les états entre ${startDate} et ${endDate} :`, stationsCountByState);

    }
}
