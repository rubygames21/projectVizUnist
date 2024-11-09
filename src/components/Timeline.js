import * as d3 from 'd3';

let onDateRangeChange = null;   
export function renderTimeline(callback) {

    onDateRangeChange = callback; // Stocker la fonction de rappel
    const container = d3.select('.timeline');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const startDate = new Date(2016, 0, 1);
    const endDate = new Date(2023, 0, 1);

    const padding = 10;
    const xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0 + padding, width - (22 + padding)]);

    const svg = d3.select('.timeline')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Ajoutez des petits traits pour chaque mois, légèrement au-dessus de l'axe
    const monthTicks = svg.append('g')
        .attr('class', 'month-ticks')
        .attr('transform', `translate(0, ${height - 25})`);

    const months = d3.timeMonths(startDate, endDate);
    monthTicks.selectAll('line')
        .data(months)
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('y1', 0)
        .attr('x2', d => xScale(d))
        .attr('y2', 5) // Longueur des petits traits
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Ajoutez l'axe des années sans sous-ticks
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear)
        .tickSize(0); // Supprime les petits traits sous les années

    svg.append('g')
        .attr('transform', `translate(0, ${height - 20})`)
        .call(xAxis);

    let selectedStart = startDate;
    let selectedEnd = endDate;

    const selection = svg.append('rect')
        .attr('class', 'selection')
        .attr('x', xScale(selectedStart))
        .attr('y', 10)
        .attr('width', xScale(selectedEnd) - xScale(selectedStart))
        .attr('height', height - 30)
        .attr('fill', 'rgba(70, 130, 180, 0.3)');

    const handleWidth = 10;

    const startHandle = svg.append('rect')
        .attr('class', 'handle')
        .attr('x', xScale(selectedStart) - handleWidth / 2)
        .attr('y', 5)
        .attr('width', handleWidth)
        .attr('height', height - 20)
        .attr('fill', 'steelblue')
        .call(d3.drag()
            .on('drag', (event) => {
                const newStart = snapToMonth(xScale.invert(event.x));
                if (newStart < selectedEnd && newStart >= startDate) {
                    selectedStart = newStart;
                    updateSelection();
                }
            })
        );

    const endHandle = svg.append('rect')
        .attr('class', 'handle')
        .attr('x', xScale(selectedEnd) - handleWidth / 2)
        .attr('y', 5)
        .attr('width', handleWidth)
        .attr('height', height - 20)
        .attr('fill', 'steelblue')
        .call(d3.drag()
            .on('drag', (event) => {
                const newEnd = snapToMonth(xScale.invert(event.x));
                if (newEnd > selectedStart && newEnd <= endDate) {
                    selectedEnd = newEnd;
                    updateSelection();
                }
            })
        );

    function snapToMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function updateSelection() {
        selection
            .attr('x', xScale(selectedStart))
            .attr('width', xScale(selectedEnd) - xScale(selectedStart));

        startHandle.attr('x', xScale(selectedStart) - handleWidth / 2);
        endHandle.attr('x', xScale(selectedEnd) - handleWidth / 2);

        console.log(`Selected range: ${selectedStart.toDateString()} - ${selectedEnd.toDateString()}`);
         if (onDateRangeChange) {
            onDateRangeChange(selectedStart, selectedEnd);
        }
    }
}
