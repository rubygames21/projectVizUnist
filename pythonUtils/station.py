import json
from collections import defaultdict
from datetime import datetime

# Charger le fichier JSON d'origine
input_file = '../public/data/stations_par_etat.json'
output_file = '../public/data/stations_by_month_cumulative.json'

with open(input_file, 'r') as f:
    stations_data = json.load(f)

# Transformer les données
result = {}

for state, stations in stations_data.items():
    state_data = defaultdict(lambda: defaultdict(int))
    for station in stations:
        open_date_str = station.get("Open Date")
        if open_date_str:
            try:
                open_date = datetime.strptime(open_date_str, "%m/%d/%y")
                year = open_date.year
                month = open_date.strftime("%B").lower()
                state_data[year][month] += 1
            except ValueError:
                print(f"Date invalide trouvée : {open_date_str}")
    
    # Transformer les données en cumulatif
    cumulative_data = defaultdict(lambda: defaultdict(int))
    cumulative_totals = defaultdict(int)
    for year in sorted(state_data.keys()):  # Trier par année
        for month in state_data[year]:
            cumulative_totals[month] += state_data[year][month]
            cumulative_data[year][month] = cumulative_totals[month]
    
    # Convertir defaultdict en dict pour la sérialisation JSON
    result[state] = {year: dict(months) for year, months in cumulative_data.items()}

# Sauvegarder le fichier JSON transformé
with open(output_file, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Données cumulées et sauvegardées dans {output_file}")
