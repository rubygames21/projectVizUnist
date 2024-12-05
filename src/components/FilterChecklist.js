import * as d3 from 'd3';
import { setFilter, getFilters } from './FilterManager';

export function renderFilterChecklist() {
    // Initialisez les filtres

    // Sélectionnez le conteneur
    const container = d3.select('.filters');
    container.selectAll('*').remove(); // Nettoyez les anciens éléments

    const filterState = getFilters();

    const filters = [
        { id: 'EV_sales', label: 'EV Sales' },
        { id: 'HEV_sales', label: 'HEV Sales' },
        { id: 'PHEV_sales', label: 'PHEV Sales' },
        { id: 'stations', label: 'Stations' },
    ];

    filters.forEach(filter => {
        const checkboxContainer = container.append('div').attr('class', 'checkbox-container');

        checkboxContainer
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', filter.id)
            .property('checked', filterState[filter.id])
            .on('change', function () {
                const isChecked = d3.select(this).property('checked');
                setFilter(filter.id, isChecked);
                const event = new CustomEvent('filtersUpdated', { detail: getFilters() });
                document.dispatchEvent(event);
            });
        
        checkboxContainer.append('label').attr('for', filter.id).text(filter.label);
    });
}


