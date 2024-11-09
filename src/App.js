import { renderMap, updateTimelineDates } from './components/Map';
import { renderTimeline } from './components/Timeline';
import renderLineChart from './components/LineGraph';

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
    filters.innerText = 'Selections/Filter Checklists';

    mapContainer.appendChild(map);
    mapContainer.appendChild(filters);
    topSection.appendChild(mapContainer);

    const sideSection = document.createElement('div');
    sideSection.classList.add('side-section');

    const lineGraph = document.createElement('div');
    lineGraph.classList.add('linegraph');
    lineGraph.innerText = 'Linegraph sales and number of stations';

    const incentives = document.createElement('div');
    incentives.classList.add('incentives');
    incentives.innerText = 'Incentives List';

    sideSection.appendChild(lineGraph);
    sideSection.appendChild(incentives);
    topSection.appendChild(sideSection);

    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    container.appendChild(topSection);
    container.appendChild(timeline);

    document.body.appendChild(container);

    renderMap();

    renderTimeline(updateTimelineDates);

    renderLineChart();
}
