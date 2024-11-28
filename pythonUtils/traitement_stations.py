import json
from datetime import datetime

# Charger le fichier JSON
input_file = "../public/data/stations_par_etat.json"
output_file = "filtered_stations.json"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Fonction pour filtrer et trier les stations
def filter_and_sort_stations(data):
    filtered_data = {}
    cutoff_date = datetime.strptime("2016-01-01", "%Y-%m-%d")  # Date limite

    for state, stations in data.items():
        filtered_stations = []
        for station in stations:
            open_date_str = station.get("Open Date")
            if isinstance(open_date_str, str):  # Vérifie si c'est une chaîne valide
                try:
                    # Convertir la date de "MM/DD/YY" en objet datetime
                    open_date = datetime.strptime(open_date_str, "%m/%d/%y")
                    if open_date >= cutoff_date:
                        filtered_stations.append(station)
                except ValueError:
                    print(f"Date invalide ignorée pour la station ID: {station.get('ID', 'Unknown')}")
            else:
                print(f"Clé 'Open Date' absente ou invalide pour la station ID: {station.get('ID', 'Unknown')}")

        # Trier les stations par date d'ouverture
        filtered_stations.sort(key=lambda x: datetime.strptime(x["Open Date"], "%m/%d/%y"))

        if filtered_stations:  # Ajouter l'état uniquement s'il y a des stations valides
            filtered_data[state] = filtered_stations

    return filtered_data

# Appliquer le filtre et le tri
filtered_data = filter_and_sort_stations(data)

# Sauvegarder les résultats
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_data, f, indent=4, ensure_ascii=False)

print(f"Les données filtrées et triées ont été sauvegardées dans : {output_file}")
