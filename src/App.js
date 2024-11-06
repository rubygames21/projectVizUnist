import { renderMap } from './components/Map';
export function initApp() {
    const container = document.createElement('div');
    container.classList.add('container');

    // Conteneur principal en haut (MAP et Side Section)
    const topSection = document.createElement('div');
    topSection.classList.add('top-section');

    // Carte (MAP) et section des filtres en dessous
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

    // Section latérale pour Line Graph et Incentives List
    const sideSection = document.createElement('div');
    sideSection.classList.add('side-section');

    const lineGraph = document.createElement('div');
    lineGraph.classList.add('linegraph');
    lineGraph.innerText = 'Line Graph';

    const incentives = document.createElement('div');
    incentives.classList.add('incentives');
    incentives.innerText = 'Incentives List';

    sideSection.appendChild(lineGraph);
    sideSection.appendChild(incentives);
    topSection.appendChild(sideSection);

    // Timeline
    const timeline = document.createElement('div');
    timeline.classList.add('timeline');
    timeline.innerText = 'Timeline';

    container.appendChild(topSection);
    container.appendChild(timeline);

    document.body.appendChild(container);
    renderMap();
}
