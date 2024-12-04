import { renderMap } from './components/Map';
import { renderTimeline } from './components/Timeline';
import { renderLineGraph } from './components/LineGraph';
import { renderIncentivesList  } from './components/IncentivesList';
import { renderFilterChecklist } from './components/FilterChecklist';

export function initApp() {
    const container = document.createElement('div');
    container.classList.add('container');

    const topSection = document.createElement('div');
    topSection.classList.add('top-section');

    const mapContainer = document.createElement('div');
    mapContainer.classList.add('map-container');

    const map = document.createElement('div');
    map.classList.add('map');

    const filters = document.createElement('div');
    filters.classList.add('filters');

    mapContainer.appendChild(map);
    mapContainer.appendChild(filters);
    topSection.appendChild(mapContainer);

    const sideSection = document.createElement('div');
    sideSection.classList.add('side-section');

    const lineGraph = document.createElement('div');
    lineGraph.classList.add('linegraph');

    const incentives = document.createElement('div');
    incentives.classList.add('incentives');
    sideSection.appendChild(lineGraph);
    sideSection.appendChild(incentives);
    topSection.appendChild(sideSection);

    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    container.appendChild(topSection);
    container.appendChild(timeline);

    document.body.appendChild(container);

    const onSelectionChange = (startDate, endDate) => {
        renderMap(startDate, endDate);
        renderLineGraph(startDate, endDate);
        renderIncentivesList(startDate, endDate)
    };
    renderTimeline(onSelectionChange);
    renderFilterChecklist();
}
