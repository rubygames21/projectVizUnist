import * as d3 from 'd3';

export function processSalesData(data) {
    const salesByState = {};
    data.forEach(row => {
        const state = row['stateName'];  
        salesByState[state] = row;
    });
    return salesByState;
}

export function loadSalesData() {
    return Promise.all([
        d3.csv('/data/EV_sales.csv', d3.autoType),
        d3.csv('/data/HEV_sales.csv', d3.autoType),
        d3.csv('/data/PHEV_sales.csv', d3.autoType)
    ]).then(([evData, hevData, phevData]) => {
        return {
            EV: processSalesData(evData),
            HEV: processSalesData(hevData),
            PHEV: processSalesData(phevData)
        };
    });
}

export async function loadSalesDataForLineGraph() {
    const data = await d3.csv('/data/sales_data.csv');
    return data.map(d => ({
        year: new Date(+d.Year, 0, 1),
        state: d.State,
        type: d.Type,
        value: +d.Sales
    }));
}

