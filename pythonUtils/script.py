import json
from datetime import datetime

# Charger le fichier JSON
input_file = "stations_par_etat.json"  # Remplacez par le chemin vers votre fichier
output_file = "filtered_stations_per_state.json"

# Définir la plage de dates
start_date = datetime.strptime("1/1/16", "%m/%d/%y")
end_date = datetime.strptime("12/31/23", "%m/%d/%y")

# Filtrer les stations par date d'ouverture
def filter_stations_by_date(data, start_date, end_date):
    filtered_data = {}
    for state, stations in data.items():
        filtered_stations = [
            station for station in stations
            if "Open Date" in station and station["Open Date"]
            and start_date <= datetime.strptime(station["Open Date"], "%m/%d/%y") <= end_date
        ]
        if filtered_stations:
            filtered_data[state] = filtered_stations
    return filtered_data

# Lire le fichier JSON d'entrée
with open(input_file, "r") as f:
    data = json.load(f)

# Appliquer le filtre
filtered_data = filter_stations_by_date(data, start_date, end_date)

# Enregistrer le fichier JSON filtré
with open(output_file, "w") as f:
    json.dump(filtered_data, f, indent=4)

print(f"Fichier filtré enregistré sous : {output_file}")
