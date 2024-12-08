import json

# Charger le fichier JSON
input_file_path = 'laws_and_incentives.json'  # Chemin vers votre fichier JSON
output_file_path = 'laws_and_incentives_sorted.json'  # Chemin pour le fichier trié

# Charger les données
with open(input_file_path, 'r') as file:
    data = json.load(file)

# Trier les incitations par état en fonction de la date
for state, incentives in data.items():
    data[state] = sorted(incentives, key=lambda x: x['Date'])

# Sauvegarder les données triées
with open(output_file_path, 'w') as file:
    json.dump(data, file, indent=4)

print(f"Données triées enregistrées dans {output_file_path}")
