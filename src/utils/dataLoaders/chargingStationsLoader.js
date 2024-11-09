export function loadChargingStations() {
    return fetch('/data/stations_par_etat.json')
        .then(response => response.json())
        .then(data => {
            const stations = Object.entries(data).flatMap(([state, stations]) =>
                stations.map(station => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [station.Longitude, station.Latitude]
                    },
                    properties: {
                        address: station['Street Address'],
                        city: station.City,
                        state: state,
                        network: station['EV Network'],
                        access: station['Access Days Time'],
                        openDate: new Date(station['Open Date'])
                    }
                }))
            );

            // Log pour vérifier les stations avec les données de géométrie complètes
            stations.forEach(station => {
                if (!station.geometry.coordinates[0] || !station.geometry.coordinates[1]) {
                    console.warn("Station sans coordonnées géographiques :", station);
                }
            });

            return stations;
        })
        .catch(error => {
            console.error("Error loading charging stations JSON:", error);
        });
}
