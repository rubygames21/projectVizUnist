/**
 * Retourne le nombre de stations ouvertes pour chaque état dans une période donnée.
 * @param {Object} chargingData - Données des stations de charge organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Object} - Nombre de stations ouvertes par état.
 */
export function getStationsCountByState(filteredStationsByState) {
    const counts = {};
    for (const [state, stations] of Object.entries(filteredStationsByState)) {
        counts[state] = stations.length; // Comptez le nombre de stations
    }
    return counts;
}


/**
 * Retourne les coordonnées GPS des stations créées pour chaque état dans une période donnée.
 * @param {Object} chargingData - Données des stations de charge organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Object} - Coordonnées GPS des stations par état.
 */
export function getStationsByState(chargingData, startDate, endDate) {
    const results = {};

    for (const [state, stations] of Object.entries(chargingData)) {
        results[state] = stations.filter(station => {
            const openDate = new Date(station["Open Date"]);
            return openDate >= startDate && openDate < endDate;
        });
    }

    return results;
}

/**
 * Retourne le nombre de stations ouvertes pour chaque état dans une période donnée.
 * @param {Object} chargingData - Données des stations de charge organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Object} - Nombre de stations ouvertes par état.
 */
export function getStationsCountByStateInRange(chargingData, startDate, endDate) {
    const stationCounts = {};

    for (const [state, stations] of Object.entries(chargingData)) {
        const count = stations.filter(station => {
            const openDate = new Date(station["Open Date"]);
            return openDate >= startDate && openDate <= endDate;
        }).length;

        stationCounts[state] = count; // Ajoute le nombre pour l'état
    }

    return stationCounts;
}


/**
 * Retourne le nombre de stations ouvertes dans un état spécifique dans une période donnée.
 * @param {Object} chargingData - Données des stations de charge organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @param {string} state - État spécifique à analyser.
 * @returns {number} - Nombre de stations ouvertes dans cet état.
 */
export function getStationsCountForStateInRange(chargingData, startDate, endDate, state) {
    if (!chargingData[state]) {
        return 0; // Retourne 0 si l'état n'existe pas dans les données
    }

    return chargingData[state].filter(station => {
        const openDate = new Date(station["Open Date"]);
        return openDate >= startDate && openDate <= endDate;
    }).length;
}
