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


/**
 * Filtre les données des stations par mois et années dans la plage de dates spécifiée.
 * @param {Object} data - Données des stations organisées par état, année et mois.
 * @param {Date} startDate - Date de début de la plage.
 * @param {Date} endDate - Date de fin de la plage.
 * @returns {Object} - Données filtrées par état, année et mois.
 */
export function filterStationsByState(data, startDate, endDate) {
    const result = {};

    for (const [state, years] of Object.entries(data)) {
        const filteredYears = {};

        for (const [year, months] of Object.entries(years)) {
            const yearInt = parseInt(year, 10);

            // Vérifier si l'année est dans la plage
            if (yearInt >= startDate.getFullYear() && yearInt <= endDate.getFullYear()) {
                const filteredMonths = {};

                for (const [month, count] of Object.entries(months)) {
                    // Convertir le mois en Date pour comparer
                    const monthDate = new Date(`${month} 1, ${year}`);

                    if (monthDate >= startDate && monthDate <= endDate) {
                        filteredMonths[month] = count;
                    }
                }

                if (Object.keys(filteredMonths).length > 0) {
                    filteredYears[year] = filteredMonths;
                }
            }
        }

        if (Object.keys(filteredYears).length > 0) {
            result[state] = filteredYears;
        }
    }

    return result;
}


/**
 * Filtre les données des stations pour un état donné par mois et années dans la plage de dates spécifiée.
 * @param {Object} data - Données des stations organisées par état, année et mois.
 * @param {string} state - Nom de l'état pour lequel on veut filtrer les données.
 * @param {Date} startDate - Date de début de la plage.
 * @param {Date} endDate - Date de fin de la plage.
 * @returns {Object} - Données filtrées pour l'état spécifié, triées par année et mois.
 */
export function filterStationsForState(data, state, startDate, endDate) {
    if (!data[state]) {
        console.warn(`Aucune donnée trouvée pour l'état : ${state}`);
        return {};
    }

    const filteredYears = {};

    for (const [year, months] of Object.entries(data[state])) {
        const yearInt = parseInt(year, 10);

        // Vérifier si l'année est dans la plage
        if (yearInt >= startDate.getFullYear() && yearInt <= endDate.getFullYear()) {
            const filteredMonths = {};

            for (const [month, count] of Object.entries(months)) {
                // Convertir le mois en Date pour comparer
                const monthDate = new Date(`${month} 1, ${year}`);

                if (monthDate >= startDate && monthDate <= endDate) {
                    filteredMonths[month] = count;
                }
            }

            if (Object.keys(filteredMonths).length > 0) {
                filteredYears[year] = filteredMonths;
            }
        }
    }

    return filteredYears;
}


filterDataByDateRange
/**
 * Cumule les données des stations pour tous les états dans une plage de dates spécifiée.
 * @param {Object} data - Données des stations organisées par état, année et mois.
 * @param {Date} startDate - Date de début de la plage.
 * @param {Date} endDate - Date de fin de la plage (exclus).
 * @returns {Object} - Données cumulées pour toutes les années et mois.
 */
export function filterDataByDateRange(data, startDate, endDate) {
    const result = {};

    for (const [state, years] of Object.entries(data)) {
        for (const [year, months] of Object.entries(years)) {
            const yearInt = parseInt(year, 10);

            // Vérifier si l'année est dans la plage
            if (yearInt >= startDate.getFullYear() && yearInt <= endDate.getFullYear()) {
                if (!result[year]) {
                    result[year] = {};
                }

                for (const [month, count] of Object.entries(months)) {
                    // Convertir le mois en Date pour comparer
                    const monthDate = new Date(`${month} 1, ${year}`);

                    // Inclure les mois dans la plage [startDate, endDate[
                    if (monthDate >= startDate && monthDate < endDate) {
                        if (!result[year][month]) {
                            result[year][month] = 0;
                        }
                        result[year][month] += count;
                    }
                }
            }
        }
    }

    return result;
}



/**
 * Filtre les données pour un état spécifique dans une plage de dates spécifiée (exclut le mois de endDate).
 * @param {Object} data - Données des stations organisées par état, année et mois.
 * @param {String} state - Nom de l'état à filtrer.
 * @param {Date} startDate - Date de début de la plage.
 * @param {Date} endDate - Date de fin de la plage (exclus).
 * @returns {Object} - Données filtrées pour l'état, année et mois.
 */
export function filterDataByDateRangeForState(data, state, startDate, endDate) {
    const stateData = data[state];
    if (!stateData) {
        console.warn(`État "${state}" introuvable dans les données.`);
        return {};
    }

    const filteredYears = {};

    for (const [year, months] of Object.entries(stateData)) {
        const yearInt = parseInt(year, 10);

        // Vérifier si l'année est dans la plage
        if (yearInt >= startDate.getFullYear() && yearInt <= endDate.getFullYear()) {
            const filteredMonths = {};

            for (const [month, count] of Object.entries(months)) {
                // Convertir le mois en Date pour comparer
                const monthDate = new Date(`${month} 1, ${year}`);

                // Inclure les mois dans la plage [startDate, endDate[
                if (monthDate >= startDate && monthDate < endDate) {
                    filteredMonths[month] = count;
                }
            }

            if (Object.keys(filteredMonths).length > 0) {
                filteredYears[year] = filteredMonths;
            }
        }
    }

    return filteredYears;
}
