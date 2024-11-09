import stationsData from '../../../public/data/stations_par_etat.json';

export function filterStationsByDateAndState(startDate, endDate, state = null) {
    return Object.entries(stationsData).flatMap(([stateName, stations]) => {
        // Filtrer par état si `state` est défini, sinon traiter tous les états
        if (state && stateName !== state) return [];
        
        // Filtrer les stations par date de création
        return stations.filter(station => {
            const openDate = new Date(station["Open Date"]);
            return openDate >= startDate && openDate <= endDate;
        });
    });
}

