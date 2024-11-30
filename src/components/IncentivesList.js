import * as d3 from 'd3';
import { getIncentivesDetailsByState, getIncentivesDetailsForState } from '../utils/dataLoaders/incentivesLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';

let incentivesData = null;

(async () => {
    try {
        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData = await incentivesResponse.json();

        console.log('IncentivesList, données chargées:', incentivesData);

        // Appeler la fonction globale de rendu
        renderIncentivesList(getStartDate(), getEndDate());
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
    }
})();

// Fonction globale pour rendre les incentives
export function renderIncentivesList(startDate = getStartDate(), endDate = getEndDate()) {
    const container = d3.select('.incentives');
    const svg = container.select('svg');

    if (svg.empty()) {
        initializeIncentivesList(container, startDate, endDate);
    } else {
        updateIncentivesList(container, startDate, endDate);
    }
}

// Initialisation de la liste des incentives
function initializeIncentivesList(container, startDate, endDate) {
    container.selectAll('*').remove(); // Supprimer tout contenu existant

    const selectedState = getSelectedState(); // Récupérer l'état sélectionné globalement

    if (selectedState) {
        const incentivesForState = getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate);
        console.log(`Incentives pour ${selectedState} entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesForState);

       
    } else {
        const incentivesByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
        console.log(`Incentives pour tous les états entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesByState);

      
    }
}

// Mise à jour de la liste des incentives
function updateIncentivesList(container, startDate, endDate) {
    container.selectAll('*').remove(); // Supprimer le contenu existant

    const selectedState = getSelectedState(); // Récupérer l'état sélectionné globalement

    if (selectedState) {
        const incentivesForState = getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate);
        console.log(`Incentives pour ${selectedState} entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesForState);

       
    } else {
        const incentivesByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
        console.log(`Incentives pour tous les états entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesByState);

    
    }
}
