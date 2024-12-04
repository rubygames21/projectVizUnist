let filters = {
    EV_sales: true,
    HEV_sales: true,
    PHEV_sales: true,
    sales_aggregate: false, 
    stations: true,
    incentives: true,
};

function initializeFilters() {
    if (filters.sales_aggregate) {
        filters.EV_sales = false;
        filters.HEV_sales = false;
        filters.PHEV_sales = false;
    } else {
        if (filters.EV_sales || filters.HEV_sales || filters.PHEV_sales) {
            filters.sales_aggregate = false;
        }
    }
}

function setFilter(filterName, value) {
    if (filterName === 'sales_aggregate' && value) {
        filters.EV_sales = false;
        filters.HEV_sales = false;
        filters.PHEV_sales = false;
    } else if (['EV_sales', 'HEV_sales', 'PHEV_sales'].includes(filterName)) {
        filters.sales_aggregate = false;
    }
    filters[filterName] = value;
}

function getFilters() {
    return { ...filters };
}

initializeFilters();

export { setFilter, getFilters, initializeFilters };
