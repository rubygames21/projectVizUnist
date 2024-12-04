import json
from collections import defaultdict
from datetime import datetime

# Charger le fichier JSON d'entrée
input_file = '../public/data/stations_par_etat.json'  # Remplacez par votre chemin
output_file = 'stations_cumulative.json'

with open(input_file, 'r') as f:
    stations_data = json.load(f)

# Ordre des mois pour garantir un traitement chronologique
month_order = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
]

# Initialiser le résultat final
result = {}

for state, stations in stations_data.items():
    # Préparer les structures de données pour le cumul
    state_data = defaultdict(lambda: defaultdict(int))  # Données mensuelles par année
    cumulative_data = defaultdict(lambda: defaultdict(int))  # Données cumulées
    running_total = 0  # Total cumulatif

    # Parcourir chaque station dans l'État
    for station in stations:
        open_date_str = station.get("Open Date")
        if open_date_str:
            try:
                # Convertir la date en objet datetime
                open_date = datetime.strptime(open_date_str, "%m/%d/%y")
                year = open_date.year
                month = month_order[open_date.month - 1]  # Convertir le numéro de mois en nom
                state_data[year][month] += 1
            except ValueError:
                print(f"Date invalide trouvée : {open_date_str}")

    # Calculer le cumul pour chaque année et chaque mois
    for year in sorted(state_data.keys()):  # Parcourir les années dans l'ordre
        for month in month_order:  # Parcourir les mois dans l'ordre
            running_total += state_data[year].get(month, 0)
            cumulative_data[year][month] = running_total

    # Ajouter les données cumulées au résultat
    result[state] = {year: dict(months) for year, months in cumulative_data.items()}

# Sauvegarder le fichier JSON résultant
with open(output_file, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Données cumulées sauvegardées dans {output_file}")
