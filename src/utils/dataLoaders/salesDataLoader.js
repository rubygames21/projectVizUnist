import * as d3 from 'd3';

// Fonction pour charger et traiter les données de ventes
export async function loadSalesData() {
    const evData = await d3.csv('data/EV_sales.csv');
    const hevData = await d3.csv('data/HEV_sales.csv');
    const phevData = await d3.csv('data/PHEV_sales.csv');
    
    return { evData, hevData, phevData };
}


export function calculateSalesByState(startDate, endDate, salesData) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth(); // Mois (0 = janvier)
    const endMonth = endDate.getMonth(); // Mois (0 = janvier)

    const results = {};

    for (const [type, data] of Object.entries(salesData)) {
        results[type] = {}; // Initialiser les résultats pour ce type

        data.forEach((row) => {
            const state = row.stateName; // Nom de l'état
            let totalSales = 0;

            for (let year = startYear; year <= endYear; year++) {
                const annualSales = parseFloat(row[year]);

                if (isNaN(annualSales)) continue;

                if (year === startYear && year === endYear) {
                    // Même année, sélectionner les mois entre startMonth et endMonth (exclu endMonth)
                    const months = endMonth - startMonth; // Exclure endMonth
                    totalSales += Math.round((annualSales / 12) * months);
                } else if (year === startYear) {
                    // Première année, compter les mois de startMonth à décembre
                    const months = 12 - startMonth;
                    totalSales += Math.round((annualSales / 12) * months);
                } else if (year === endYear) {
                    // Dernière année, compter les mois de janvier à endMonth (exclu endMonth)
                    const months = endMonth; // Exclure endMonth
                    totalSales += Math.round((annualSales / 12) * months);
                } else {
                    totalSales += annualSales;
                }
            }
            results[type][state] = totalSales;
        });
    }

    return results; 
}

export function calculateSalesByMonthForState(startDate, endDate, stateName, salesData) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth(); // Mois (0 = janvier)
    const endMonth = endDate.getMonth(); // Mois (0 = janvier)

    const results = {};

    for (const [type, data] of Object.entries(salesData)) {
        results[type] = {}; // Initialiser les résultats pour ce type

        // Trouver les données pour l'état sélectionné
        const stateData = data.find((row) => row.stateName === stateName);
        if (!stateData) continue;

        let cumulativeSum = 0; // Réinitialiser le cumul pour chaque type

        for (let year = startYear; year <= endYear; year++) {
            const annualSales = parseFloat(stateData[year]);

            if (isNaN(annualSales)) continue;

            const monthlySales = Math.round(annualSales / 12);

            // Initialiser les mois pour cette année
            if (!results[type][year]) {
                results[type][year] = {};
            }

            for (let month = 0; month < 12; month++) {
                const isInRange =
                    (year > startYear || month >= startMonth) &&
                    (year < endYear || month <= endMonth);

                if (isInRange) {
                    const monthName = new Date(year, month)
                        .toLocaleString('default', { month: 'long' })
                        .toLowerCase();

                    cumulativeSum += monthlySales; // Ajouter les ventes mensuelles au cumul
                    results[type][year][monthName] = cumulativeSum;
                }
            }
        }
    }

    return results;
}



export function calculateTotalSalesByMonth(startDate, endDate, salesData) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth(); // 0 = janvier
    const endMonth = endDate.getMonth(); // 0 = janvier

    // Tableau des noms des mois
    const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];

    // Initialiser les résultats
    const results = {
        evData: {},
        hevData: {},
        phevData: {},
    };

    for (const type in results) {
        let cumulativeSum = 0; // Cumul global pour ce type de ventes

        for (let year = startYear; year <= endYear; year++) {
            results[type][year] = {};

            for (let month = 0; month < 12; month++) {
                const isInRange =
                    (year > startYear || month >= startMonth) &&
                    (year < endYear || month <= endMonth);

                if (!isInRange) continue; // Ignorer les mois hors plage

                const monthName = monthNames[month];

                // Somme des ventes mensuelles pour tous les états
                let monthlySales = 0;
                salesData[type].forEach((row) => {
                    const annualSales = parseFloat(row[year]) || 0;
                    monthlySales += Math.round(annualSales / 12);
                });

                // Ajouter les ventes mensuelles au cumul global
                cumulativeSum += monthlySales;

                // Assigner le cumul au mois en question
                results[type][year][monthName] = cumulativeSum;
            }
        }
    }

    return results;
}


