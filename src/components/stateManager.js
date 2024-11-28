let appState = {
    startDate: new Date(2016, 0, 1), // Date par défaut
    endDate: new Date(2024, 0, 1),   // Date par défaut
};

export function setStartDate(date) {
    appState.startDate = date;
}

export function setEndDate(date) {
    appState.endDate = date;
}

export function getStartDate() {
    return appState.startDate;
}

export function getEndDate() {
    return appState.endDate;
}
