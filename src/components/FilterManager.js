let filters = {
    EV_sales: true,
    HEV_sales: true,
    PHEV_sales: true,
    stations: true,
};



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


export { setFilter, getFilters};
