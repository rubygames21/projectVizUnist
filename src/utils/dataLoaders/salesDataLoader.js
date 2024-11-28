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

export function calculateSalesByYearForState(startDate, endDate, stateName, salesData) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth(); // Mois (0 = janvier)
    const endMonth = endDate.getMonth(); // Mois (0 = janvier)

    const results = {};

    for (const [type, data] of Object.entries(salesData)) {
        results[type] = {}; // Initialiser les résultats pour ce type

        const stateData = data.find((row) => row.stateName === stateName);
        if (!stateData) continue;

        for (let year = startYear; year <= endYear; year++) {
            const annualSales = parseFloat(stateData[year]);

            if (isNaN(annualSales)) {
                results[type][year] = 0;
                continue;
            }

            let adjustedSales = annualSales;

            if (year === startYear && year === endYear) {
                const monthsIncluded = endMonth - startMonth; // Exclure endMonth
                adjustedSales = Math.round((annualSales / 12) * monthsIncluded);
            } else if (year === startYear) {
                const monthsIncluded = 12 - startMonth;
                adjustedSales = Math.round((annualSales / 12) * monthsIncluded);
            } else if (year === endYear) {
                const monthsIncluded = endMonth; // Exclure endMonth
                adjustedSales = Math.round((annualSales / 12) * monthsIncluded);
            }

            results[type][year] = adjustedSales;
        }
    }

    return results;
}

export function calculateTotalSalesByYear(startDate, endDate, salesData) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const allYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    // Initialiser les résultats
    const results = {
        evData: {},
        hevData: {},
        phevData: {},
    };

    // Initialiser les résultats pour chaque année
    for (const year of allYears) {
        results.evData[year] = 0;
        results.hevData[year] = 0;
        results.phevData[year] = 0;
    }

    // Calculer les ventes pour chaque état
    salesData.evData.forEach((row) => {
        const stateName = row.stateName;

        const stateResults = calculateSalesByYearForState(startDate, endDate, stateName, salesData);

        // Cumuler les résultats par année
        for (const year of allYears) {
            results.evData[year] += stateResults.evData[year] || 0;
            results.hevData[year] += stateResults.hevData[year] || 0;
            results.phevData[year] += stateResults.phevData[year] || 0;
        }
    });
    for (const type in results) {
        results[type] = Object.fromEntries(
            Object.entries(results[type]).filter(([_, value]) => value > 0)
        );
    }

    return results;
}
