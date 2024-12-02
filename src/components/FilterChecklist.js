let filters = {
    EV_sales : true,
    HEV_sales : true,
    PHEV_sales : true,
    sales_aggregate : false,
    stations : true,
    incentives : true
};

export function setDisplayEVSales(bool_from_checkbox) {
    filters.EV_sales = bool_from_checkbox;
}

export function setDisplayHEVSales(bool_from_checkbox) {
    filters.HEV_sales = bool_from_checkbox;
}

export function setDisplayPHEVSales(bool_from_checkbox) {
    filters.PHEV_sales = bool_from_checkbox;
}

export function setDisplaySalesAggregate(bool_from_checkbox) {
    filters.EVsales_aggregate_sales = bool_from_checkbox;
    filters.EV_sales = !bool_from_checkbox;
    filters.EV_sales = !bool_from_checkbox;
    filters.EV_sales = !bool_from_checkbox;
}

export function setDisplayStations(bool_from_checkbox) {
    filters.stations = bool_from_checkbox;
}

export function setDisplayIncentives(bool_from_checkbox) {
    filters.incentives = bool_from_checkbox;
}


export function getDisplayEVSales() {
    return filters.EV_sales;
}

export function getDisplayHEVSales() {
    return filters.HEV_sales;
}

export function getDisplayPHEVSales() {
    return filters.PHEV_sales;
}

export function getDisplaySalesAggregate() {
    return filters.sales_aggregate;
}

export function getDisplayStations() {
    return filters.stations;
}

export function getDisplayIncentives() {
    return filters.incentives;
}