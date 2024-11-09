let lineChartData = [];

export function updateLineChartData(filteredStations) {
    lineChartData = filteredStations;
    renderLineChart(); // Rafraîchit le graphique avec les nouvelles données
}

function renderLineChart() {
    console.log("Filtered Stations for Line Chart:", lineChartData);

    // Utilisez `lineChartData` pour mettre à jour le graphique
    // ...
}

export default renderLineChart;
