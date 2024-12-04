import json
from collections import defaultdict
from datetime import datetime

# Charger le fichier JSON d'origine
input_file = '../public/data/stations_par_etat.json'
output_file = '../public/data/stations_by_month_cumulative.json'

with open(input_file, 'r') as f:
    stations_data = json.load(f)

# Ordre des mois pour garantir un cumul correct
month_order = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
]

# Transformer les données
result = {}

for state, yearly_data in stations_data.items():
    cumulative_data = defaultdict(lambda: defaultdict(int))  # Données cumulées

    # Trier les années
    for year in sorted(yearly_data.keys()):
        year_data = yearly_data[year]

        # Initialiser le cumul de l'année en cours
        running_total = 0

        # Cumuler les mois dans l'ordre défini
        for month in month_order:
            running_total += year_data.get(month, 0)
            cumulative_data[year][month] = running_total

    # Convertir defaultdict en dict pour la sérialisation JSON
    result[state] = {year: dict(months) for year, months in cumulative_data.items()}

# Sauvegarder le fichier JSON transformé
with open(output_file, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Données cumulées et sauvegardées dans {output_file}")
