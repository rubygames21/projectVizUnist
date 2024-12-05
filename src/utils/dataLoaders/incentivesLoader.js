/**
 * Retourne le nombre d'incentives pour chaque état dans une période donnée.
 * @param {Object} incentivesData - Données des incentives organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Object} - Nombre d'incentives par état.
 */
export function getIncentivesCountByState(incentivesData, startDate, endDate) {
    const results = {};
    for (const [state, incentives] of Object.entries(incentivesData)) {
        results[state] = incentives.filter(incentive => {
            const incentiveDate = new Date(incentive.Date);
            return incentiveDate >= startDate && incentiveDate < endDate;
        }).length;
    }
    return results;
}

/**
 * Retourne les détails des incentives créées pour chaque état dans une période donnée.
 * @param {Object} incentivesData - Données des incentives organisées par état.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Object} - Détails des incentives par état.
 */
export function getIncentivesDetailsByState(incentivesData, startDate, endDate) {
    const results = {};
    for (const [state, incentives] of Object.entries(incentivesData)) {
        results[state] = incentives.filter(incentive => {
            const incentiveDate = new Date(incentive.Date);
            return incentiveDate >= startDate && incentiveDate < endDate;
        });
    }
    return results;
}

/**
 * Retourne les détails des incentives créées pour un état donné dans une période donnée.
 * @param {Object} incentivesData - Données des incentives organisées par état.
 * @param {string} state - L'état pour lequel on veut récupérer les incentives.
 * @param {Date} startDate - Date de début de la période sélectionnée.
 * @param {Date} endDate - Date de fin de la période sélectionnée.
 * @returns {Array} - Détails des incentives pour l'état spécifié.
 */
export function getIncentivesDetailsForState(incentivesData, state, startDate, endDate) {
    if (!incentivesData[state]) {
        console.error(`L'état ${state} n'a pas d'incentives enregistrées.`);
        return [];
    }
    return incentivesData[state].filter(incentive => {
        const incentiveDate = new Date(incentive.Date);
        return incentiveDate >= startDate && incentiveDate < endDate;
    });
}
