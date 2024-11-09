import * as d3 from 'd3';

export function prepareDataForLineChart(stations) {
    // Comptez les stations par année
    const stationsByYear = d3.rollup(
        stations,
        v => v.length,
        station => station.properties.openDate.getFullYear()
    );

    // Transformez en tableau pour d3
    return Array.from(stationsByYear, ([year, count]) => ({ year, count }));
}
