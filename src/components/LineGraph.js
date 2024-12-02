import * as d3 from 'd3';
import { calculateSalesByYearForState, calculateTotalSalesByYear, loadSalesData } from '../utils/dataLoaders/salesDataLoader';
import { getStationsCountByStateInRange, getStationsCountForStateInRange } from '../utils/dataLoaders/chargingStationsLoader';
import { getIncentivesDetailsByState, getIncentivesDetailsForState } from '../utils/dataLoaders/incentivesLoader';
import { getStartDate, getEndDate, getSelectedState  } from './stateManager';

let salesData = null;
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

        renderLineGraph(defaultStartDate, defaultEndDate);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
})();

export function renderLineGraph(startDate = getStartDate(), endDate = getEndDate()) {
    if (!salesData || !chargingData || !incentivesData) {
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

    const xScale = d3.scaleBand()
        .domain(d3.range(startDate.getFullYear(), endDate.getFullYear() + 1))
        .range([50, width - 50])

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

        const selectedState = getSelectedState(); 

    if (selectedState) {
        const stationsCount = getStationsCountForStateInRange(chargingData, startDate, endDate, getSelectedState());
        const salesCountForState = calculateSalesByYearForState(startDate, endDate, getSelectedState(), salesData);
        const incentivesDetailsForState = getIncentivesDetailsForState(incentivesData, getSelectedState(), startDate, endDate);
         console.log('LGS : getIncentivesDetailsForState : ', incentivesDetailsForState);
         console.log('LGS : salesCountForState : ', salesCountForState)
         console.log('LGS : stationsCount : ', stationsCount)
    } else {
        const stationsCountByState = getStationsCountByStateInRange(chargingData, startDate, endDate);
        const totalSalesByYear = calculateTotalSalesByYear(startDate, endDate, salesData);
        const IncentivesCountByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
         console.log('LG : IncentivesCountByState : ', IncentivesCountByState);
         console.log('LG : totalSalesByYear : ', totalSalesByYear);
         console.log('LG : stationsCountByState : ', stationsCountByState);
    }
}

function updateLineGraph(svg, startDate, endDate, width, height) {
    const xScale = d3.scaleBand()
        .domain(d3.range(startDate.getFullYear(), endDate.getFullYear() + 1))
        .range([50, width - 50])

    const yScale = d3.scaleLinear()
        .domain([0, 800000])
        .range([height - 50, 50]);

    svg.select('.x-axis')
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

    svg.select('.y-axis')
        .call(d3.axisLeft(yScale));
    const selectedState = getSelectedState(); 
    if (selectedState) {
        const stationsCount = getStationsCountForStateInRange(chargingData, startDate, endDate, getSelectedState());
        const salesCountForState = calculateSalesByYearForState(startDate, endDate, getSelectedState(), salesData);
        const incentivesDetailsForState = getIncentivesDetailsForState(incentivesData, getSelectedState(), startDate, endDate);
         console.log('LGS : getIncentivesDetailsForState : ', incentivesDetailsForState);
         console.log('LGS : salesCountForState : ', salesCountForState)
         console.log('LGS : stationsCount : ', stationsCount)
    } else {
        const stationsCountByState = getStationsCountByStateInRange(chargingData, startDate, endDate);
        const totalSalesByYear = calculateTotalSalesByYear(startDate, endDate, salesData);
        const IncentivesCountByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
         console.log('LG : IncentivesCountByState : ', IncentivesCountByState);
         console.log('LG : totalSalesByYear : ', totalSalesByYear);
         console.log('LG : stationsCountByState : ', stationsCountByState);
    }
}
