let filters = {
    EV_sales: true,
    HEV_sales: true,
    PHEV_sales: true,
    stations: true,
};

function setFilter(filterName, value) {
    filters[filterName] = value;
}

function getFilters() {
    return { ...filters };
}


export { setFilter, getFilters};
