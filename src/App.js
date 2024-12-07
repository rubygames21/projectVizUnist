import { renderMap } from './components/Map';
import { renderTimeline } from './components/Timeline';
import { renderLineGraph } from './components/LineGraph';
import { renderIncentivesList  } from './components/IncentivesList';
import { renderFilterChecklist } from './components/FilterChecklist';
import { getStartDate, getEndDate } from './components/stateManager';
export function initApp() {
    const container = document.createElement('div');
    container.classList.add('container');

    // Top Section
    const topSection = document.createElement('div');
    topSection.classList.add('top-section');

    // Left Section
    const sideLeftSection = document.createElement('div');
    sideLeftSection.classList.add('side-left-section');

    const mainTitle = document.createElement('div');
    mainTitle.classList.add('main-title');
    mainTitle.textContent = 'Analyzing EV Trends and Charging Infrastructure in the U.S.'; // Ajoutez du contenu si nécessaire

    const mapContentContainer = document.createElement('div');
    mapContentContainer.classList.add('map-content-container');

    const mapTitle = document.createElement('div');
    mapTitle.classList.add('map-title');
    mapTitle.textContent = 'Map Title'; // Ajoutez du contenu si nécessaire

    const map = document.createElement('div');
    map.classList.add('map');

    mapContentContainer.appendChild(mapTitle);
    mapContentContainer.appendChild(map);

    const filters = document.createElement('div');
    filters.classList.add('filters');

    sideLeftSection.appendChild(mainTitle);
    sideLeftSection.appendChild(mapContentContainer);
    sideLeftSection.appendChild(filters);

    // Right Section
    const sideSection = document.createElement('div');
    sideSection.classList.add('side-section');

    const lineGraph = document.createElement('div');
    lineGraph.classList.add('linegraph');

    const lineGraphTitle = document.createElement('div');
    lineGraphTitle.classList.add('linegraph-title');
    lineGraphTitle.textContent = 'Linegraph Title';


    const linegraphContainer = document.createElement('div');
    linegraphContainer.classList.add('linegraph-container');

    linegraphContainer.appendChild(lineGraphTitle);
    linegraphContainer.appendChild(lineGraph);

    const incentives = document.createElement('div');
    incentives.classList.add('incentives');

    const incentivesTitle = document.createElement('div');
    incentivesTitle.classList.add('incentives-title');
    incentivesTitle.textContent = 'Policy measures list'; 

    const incentivesLegend = document.createElement('div');
    incentivesLegend.classList.add('incentives-legend');
    incentivesLegend.textContent = 'L&R : Law & regulations  |  USI : US Incentive  |  SI : State Incentive';

    const incentivesContainer = document.createElement('div');
    incentivesContainer.classList.add('incentives-container');

    incentivesContainer.appendChild(incentivesTitle);
    incentivesContainer.appendChild(incentives);
    incentivesContainer.appendChild(incentivesLegend);

    sideSection.appendChild(linegraphContainer);
    sideSection.appendChild(incentivesContainer);

    // Append Left and Right Sections to Top Section
    topSection.appendChild(sideLeftSection);
    topSection.appendChild(sideSection);

    // Timeline Section
    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    // Append Sections to Main Container
    container.appendChild(topSection);
    container.appendChild(timeline);

    // Append Main Container to Body
    document.body.appendChild(container);

    // Initialize Interactive Components
    renderFilterChecklist();

    const onSelectionChange = (startDate, endDate) => {
        renderMap(startDate, endDate);
        renderLineGraph(startDate, endDate);
        renderIncentivesList(startDate, endDate);
    };

    renderTimeline(onSelectionChange);

    // Listen to Filter Updates
    document.addEventListener('filtersUpdated', () => {
        const startDate = getStartDate();
        const endDate = getEndDate();
        renderLineGraph(startDate, endDate);
        renderMap(startDate, endDate);
        renderIncentivesList(startDate, endDate);
    });
}
