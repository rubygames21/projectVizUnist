import * as d3 from 'd3';
import { setFilter, getFilters, initializeFilters } from './FilterManager';

export function renderFilterChecklist() {
    // Initialisez les filtres
    initializeFilters();

    // Sélectionnez le conteneur
    const container = d3.select('.filters');
    container.selectAll('*').remove(); // Nettoyez les anciens éléments

    const filterState = getFilters();

    const filters = [
        { id: 'EV_sales', label: 'EV Sales' },
        { id: 'HEV_sales', label: 'HEV Sales' },
        { id: 'PHEV_sales', label: 'PHEV Sales' },
        { id: 'sales_aggregate', label: 'Aggregate Sales' },
        { id: 'stations', label: 'Stations' },
        { id: 'incentives', label: 'Incentives' },
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

                // Gestion conditionnelle
                if (filter.id === 'sales_aggregate' && isChecked) {
                    d3.select('#EV_sales').property('checked', false);
                    d3.select('#HEV_sales').property('checked', false);
                    d3.select('#PHEV_sales').property('checked', false);
                } else if (['EV_sales', 'HEV_sales', 'PHEV_sales'].includes(filter.id) && isChecked) {
                    d3.select('#sales_aggregate').property('checked', false);
                }
            });

        checkboxContainer.append('label').attr('for', filter.id).text(filter.label);
    });
}
