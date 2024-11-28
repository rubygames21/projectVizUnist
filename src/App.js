import { renderMap } from './components/Map';
import { renderTimeline } from './components/Timeline';
import { renderLineGraph } from './components/LineGraph';

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

    const defaultStartDate = new Date(2016, 0, 1); // Date par défaut (janvier 2016)
    const defaultEndDate = new Date(2023, 11, 31); // Date par défaut (décembre 2023)

    const onSelectionChange = (startDate, endDate) => {
        renderMap(startDate, endDate);
        renderLineGraph(startDate, endDate);
    };

    // Lier la carte au graphique
    renderTimeline(onSelectionChange);
}
