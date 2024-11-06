import * as d3 from 'd3';

export function processSalesData(data) {
    const salesByState = {};
    data.forEach(row => {
        const state = row['stateName'];  
        salesByState[state] = row;
    });
    return salesByState;
}

// Fonction pour charger les fichiers CSV et organiser les données
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

