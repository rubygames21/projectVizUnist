import * as d3 from 'd3';
import { getIncentivesDetailsByState, getIncentivesDetailsForState } from '../utils/dataLoaders/incentivesLoader';
import { getStartDate, getEndDate, getSelectedState } from './stateManager';

let incentivesData = null;

(async () => {
    try {
        const incentivesResponse = await fetch('/data/laws_and_incentives.json');
        if (!incentivesResponse.ok) throw new Error(`Erreur HTTP Incentives: ${incentivesResponse.status}`);
        incentivesData = await incentivesResponse.json();

        //console.log('IncentivesList, données chargées:', incentivesData);

        const incentivesElement = document.querySelector('.incentives');
    
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

    const selectedState = getSelectedState(); 

    if (selectedState) {
        const incentivesForState = getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate);
        //console.log(`Incentives pour ${selectedState} entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesForState);

        // Afficher les incentives pour un état spécifique
        renderIncentives(container, incentivesForState);
    } else {
        const incentivesByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
        //console.log(`Incentives pour tous les états entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesByState);

        // Afficher les incentives groupés par état
        Object.entries(incentivesByState).forEach(([state, incentives]) => {
            container.append('h3')
                .text(state)
                .style('margin-bottom', '10px')
                .style('margin-top', '10px');

            renderIncentives(container, incentives);
        });
    }
}

// Mise à jour de la liste des incentives
function updateIncentivesList(container, startDate, endDate) {
    container.selectAll('*').remove(); // Supprimer le contenu existant

    const selectedState = getSelectedState(); 

    if (selectedState) {
        const incentivesForState = getIncentivesDetailsForState(incentivesData, selectedState, startDate, endDate);
        //console.log(`Incentives pour ${selectedState} entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesForState);
        
        renderIncentives(container, incentivesForState);
    } else {
        const incentivesByState = getIncentivesDetailsByState(incentivesData, startDate, endDate);
        //console.log(`Incentives pour tous les états entre ${startDate.toDateString()} et ${endDate.toDateString()} :`, incentivesByState);

        Object.entries(incentivesByState).forEach(([state, incentives]) => {
            container.append('h3')
                .text(state)
                .style('margin-bottom', '10px')
                .style('margin-top', '10px');

            renderIncentives(container, incentives);
        });
    }
}
function renderIncentives(container, incentives) {
    incentives.forEach(incentive => {
        const row = container.append('div')
            .attr('class', 'incentive-row')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-bottom', '10px')
            .style('padding', '10px')
            .style('background-color', '#f5f5f5')
            .style('border-radius', '5px')
            .style('border', '1px solid #ccc')
            .style('width', '97%')
            .style('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.1)'); // Ajout d'une ombre légère

            row.append('img')
            .attr('src', (() => {
                switch (incentive.Category) {
                    case 'Laws and Regulations':
                        return 'data/l&r.png'; // Chemin pour Laws and Regulations
                    case 'State Incentives':
                        return 'data/st.png'; // Chemin pour State Incentive
                    case 'Incentives':
                        return '/data/usi.png'; // Chemin pour Incentive
                }
            })())
            .attr('alt', incentive.Category || 'Default')
            .style('width', '30px') // Taille de l'image
            .style('height', '30px')
            .style('margin-right', '10px');


        row.append('span')
            .text(formatDate(incentive.Date))
            .style('margin-right', '10px')
            .style('color', '#333') // Texte légèrement plus sombre pour le contraste
            .style('font-weight', 'bold'); // Texte en gras

        row.append('span')
            .text(incentive["Project Name"])
            .style('flex', '1')
            .style('margin-right', '10px')
            .style('color', '#333')
            .style('font-size', '14px'); // Taille de texte ajustée

            const typesContainer = row.append('div')
            .style('display', 'flex')
            .style('gap', '25px') // Espacement entre les icônes
            .style('margin-left', 'auto') // Aligne les icônes à droite
        
        const supportedTypes = incentive["Types Supported"]?.split('|') || [];
        supportedTypes.forEach(type => {
            let imgSrc;
            switch (type) {
                case 'ELEC':
                    imgSrc = 'data/ev.png';
                    break;
                case 'HEV':
                    imgSrc = 'data/hev.png';
                    break;
                case 'PHEV':
                    imgSrc = 'data/phev.png';
                    break;
            }
        
            if (imgSrc) {
                typesContainer.append('img')
                    .attr('src', imgSrc)
                    .attr('alt', type)
                    .style('width', '30px') // Ajustez la taille si nécessaire
                    .style('height', '30px')
                    .style('transform', 'scale(2.5)') // Zoom des logos
                    .style('transform-origin', 'center') // Centre le zoom
                    .style('margin-right','20px') 

            }
        });
    });
}


// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Fonction pour tronquer le texte
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}
