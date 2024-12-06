import * as d3 from 'd3';
import { setStartDate, setEndDate } from './stateManager';


export function renderTimeline(onSelectionChange) {
    const timelineContainer = document.querySelector('.timeline');
    const containerWidth = timelineContainer.offsetWidth;
    const height = 80;
    const margin = { left: 40, right: 40, top: 0, bottom: 20 };

    const svg = d3
        .select(timelineContainer)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height);

    const startDate = new Date(2016, 0, 1); // Janvier 2016
    const endDate = new Date(2024, 0,1); // Décembre 2023
    const xScale = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([margin.left, containerWidth - margin.right]);

    const xAxisYears = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(1))
        .tickSize(10)
        .tickFormat(d3.timeFormat('%Y'));

    svg.append('g')
        .attr('class', 'years-axis')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxisYears);

    const xAxisMonths = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickSize(-10)
        .tickFormat(() => '');

    svg.append('g')
        .attr('class', 'months-axis')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxisMonths);

    let selectedStartDate = startDate;
    let selectedEndDate = endDate;

    svg.append('line')
        .attr('x1', xScale(startDate))
        .attr('y1', height / 2)
        .attr('x2', xScale(endDate))
        .attr('y2', height / 2)
        .style('stroke', '#ccc')
        .style('stroke-width', 6);

    const rectWidth = 10;

    const startRect = svg
        .append('rect')
        .attr('class', 'start-rect')
        .attr('x', xScale(selectedStartDate) - rectWidth / 2)
        .attr('y', height / 4)
        .attr('width', rectWidth)
        .attr('height', height / 2)
        .style('fill', '#69b3a2')
        .style('cursor', 'ew-resize')
        .call(
            d3
                .drag()
                .on('drag', function (event) {
                    const newDate = snapToMonth(xScale.invert(event.x));

                    // Empêcher la superposition : la nouvelle date de début doit être < date de fin
                    if (newDate >= startDate && newDate < selectedEndDate) {
                        selectedStartDate = newDate;
                        d3.select(this).attr('x', xScale(selectedStartDate) - rectWidth / 2);
                        updateRange();
                    }
                })
        );

    const endRect = svg
        .append('rect')
        .attr('class', 'end-rect')
        .attr('x', xScale(selectedEndDate) - rectWidth / 2)
        .attr('y', height / 4)
        .attr('width', rectWidth)
        .attr('height', height / 2)
        .style('fill', '#69b3a2')
        .style('cursor', 'ew-resize')
        .call(
            d3
                .drag()
                .on('drag', function (event) {
                    const newDate = snapToMonth(xScale.invert(event.x));

                    if (newDate <= endDate && newDate > selectedStartDate) {
                        selectedEndDate = newDate;
                        d3.select(this).attr('x', xScale(selectedEndDate) - rectWidth / 2);
                        updateRange();
                    }
                })
        );

    const rangeLine = svg
        .append('line')
        .attr('class', 'range-line')
        .attr('x1', xScale(selectedStartDate))
        .attr('y1', height / 2)
        .attr('x2', xScale(selectedEndDate))
        .attr('y2', height / 2)
        .style('stroke', '#ff7f0e')
        .style('stroke-width', 6);

    function snapToMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1); // Début du mois
    }

    const startDateText = svg.append('text')
    .attr('class', 'start-date-text')
    .attr('x', xScale(selectedStartDate))
    .attr('y', height / 4 - 10) // Position au-dessus du curseur
    .attr('text-anchor', 'middle')
    .style('fill', '#333')
    .style('font-size', '12px')
    .text(formatDate(selectedStartDate));

    const endDateText = svg.append('text')
    .attr('class', 'end-date-text')
    .attr('x', xScale(selectedEndDate))
    .attr('y', height / 4 - 10) // Position au-dessus du curseur
    .attr('text-anchor', 'middle')
    .style('fill', '#333')
    .style('font-size', '12px')
    .text(formatDate(selectedEndDate));

    function updateRange() {
        rangeLine
            .attr('x1', xScale(selectedStartDate))
            .attr('x2', xScale(selectedEndDate));
    
        // Calcule la distance entre les curseurs
        const distance = Math.abs(xScale(selectedEndDate) - xScale(selectedStartDate) - 40);
    
        const containerWidth = timelineContainer.offsetWidth;
    
        if (distance < 50) {
            // Collision : Texte fusionné au milieu
            const midPoint = (xScale(selectedStartDate) + xScale(selectedEndDate)) / 2;
            startDateText
                .attr('x', midPoint)
                .attr('text-anchor', 'middle')
                .text(`${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`);
            endDateText.text(''); // Vider, mais ne pas utiliser pour les collisions
        } else {
            // Pas de collision : Texte aux curseurs respectifs
            startDateText
                .attr('x', xScale(selectedStartDate))
                .attr('text-anchor', 'middle')
                .text(formatDate(selectedStartDate));
            endDateText
                .attr('x', xScale(selectedEndDate))
                .attr('text-anchor', 'middle')
                .text(formatDate(selectedEndDate));
        }
    
        // Récupère les dimensions du texte
        const startTextBBox = startDateText.node().getBBox();
        const endTextBBox = endDateText.node().getBBox();
    
        // Corrige le texte de début s'il dépasse à gauche
        if (startTextBBox.x < 0) {
            startDateText.attr('x', startTextBBox.width / 2);
        }
    
        // Vérifie que endTextRightEdge est valide avant de le calculer
        if (distance >= 50) {
            const endTextRightEdge = endTextBBox.x + endTextBBox.width;
            
            // Corrige le texte de fin s'il dépasse à droite
            if (endTextRightEdge > containerWidth - 10) {
                endDateText
                    .attr('x', containerWidth - endTextBBox.width / 2 - 10)
                    .attr('text-anchor', 'end');
            }
        }
    
        // Mets à jour les dates sélectionnées
        setStartDate(selectedStartDate);
        setEndDate(selectedEndDate);
        if (onSelectionChange) {
            onSelectionChange(selectedStartDate, selectedEndDate);
        }
    }
    
    



    window.addEventListener('resize', () => {
        const newWidth = timelineContainer.offsetWidth;
        svg.attr('width', newWidth);

        xScale.range([margin.left, newWidth - margin.right]);

        svg.select('.start-rect').attr('x', xScale(selectedStartDate) - rectWidth / 2);
        svg.select('.end-rect').attr('x', xScale(selectedEndDate) - rectWidth / 2);

        rangeLine
            .attr('x1', xScale(selectedStartDate))
            .attr('x2', xScale(selectedEndDate));

        svg.select('.years-axis').call(
            d3.axisBottom(xScale)
                .ticks(d3.timeYear.every(1))
                .tickSize(10)
                .tickFormat(d3.timeFormat('%Y'))
        );

        svg.select('.months-axis').call(
            d3.axisBottom(xScale)
                .ticks(d3.timeMonth.every(1))
                .tickSize(-10)
                .tickFormat(() => '')
                .tickValues(
                    d3.timeMonth
                        .range(startDate, endDate)
                        .filter((d) => d.getMonth() !== 0)
                )
        );
    });
}

function formatDate(date) {
    return d3.timeFormat('%B %Y')(date); // Ex : "January 2016"
}