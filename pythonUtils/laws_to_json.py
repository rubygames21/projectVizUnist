import pandas as pd
import json

# Dictionnaire des codes d'état
state_dict = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia", "US":"United States of America"
}

# Charger le fichier CSV
csv_file = "./public/data/laws_and_incentives.csv"
df = pd.read_csv(csv_file, header=None, names=["State", "Project Name", "Date", "Category", "Types Supported"])

# Remplacer les codes d'État par leurs noms complets
df["State"] = df["State"].map(state_dict)

# Restructurer les données dans le format désiré
grouped_data = {}
for _, row in df.iterrows():
    state = row["State"]
    project = {
        "Project Name": row["Project Name"],
        "Date": row["Date"],
        "Category": row["Category"],
        "Types Supported": row["Types Supported"]
    }
    if state not in grouped_data:
        grouped_data[state] = []
    grouped_data[state].append(project)

# Sauvegarder en fichier JSON
json_file = "laws_and_incentives_grouped.json"
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(grouped_data, f, indent=4, ensure_ascii=False)

print(f"Les données ont été converties et enregistrées dans : {json_file}")
with open(json_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Calculer le nombre de lois pour chaque état ou pour le pays
state_law_counts = {state: len(laws) for state, laws in data.items()}

# Afficher les résultats
for state, count in state_law_counts.items():
    print(f"{state}: {count} laws")

# Sauvegarder les résultats dans un fichier JSON
output_file = "state_law_counts.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(state_law_counts, f, indent=4, ensure_ascii=False)

print(f"Les résultats ont été sauvegardés dans : {output_file}")