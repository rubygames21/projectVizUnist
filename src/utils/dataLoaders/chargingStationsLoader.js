import * as d3 from 'd3';

export function loadChargingStations() {
    return d3.csv('/data/charging_stations.csv').then(stations => {
        const formattedStations = stations.map(station => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [+station.Longitude, +station.Latitude]
            },
            properties: {
                address: station['Street Address'],
                city: station.City,
                state: station.State, // Assurez-vous que 'State' correspond bien au nom exact de la colonne
                network: station['EV Network'],
                access: station['Access Days Time']
            }
        }));
        
        return formattedStations;
    });
}
