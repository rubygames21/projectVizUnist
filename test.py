import pandas as pd
import json

# Dictionnaire de traduction des codes d'états en noms complets
state_dict = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "Californie",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Floride", "GA": "Géorgie",
    "HI": "Hawaï", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiane", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "Nouveau-Mexique", "NY": "New York", "NC": "Caroline du Nord", "ND": "Dakota du Nord", 
    "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvanie", "RI": "Rhode Island", 
    "SC": "Caroline du Sud", "SD": "Dakota du Sud", "TN": "Tennessee", "TX": "Texas", 
    "UT": "Utah", "VT": "Vermont", "VA": "Virginie", "WA": "Washington", "WV": "Virginie-Occidentale", 
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District de Columbia"
}

# Charger les données CSV
df = pd.read_csv('stations.csv')

# Remplacer les codes d'état par les noms complets en utilisant le dictionnaire
df['State'] = df['State'].map(state_dict)

# Convertir NaN en None pour que JSON les enregistre comme null
df = df.where(pd.notnull(df), None)

# Assurer que les colonnes de nombres entiers ne soient pas converties en flottants
int_columns = ['EV Level1 EVSE Num', 'EV Level2 EVSE Num', 'EV DC Fast Count', 'ID']
for col in int_columns:
    if col in df.columns:
        df[col] = df[col].apply(lambda x: int(x) if isinstance(x, float) and x.is_integer() else x)

# Grouper les données par état et les convertir en un dictionnaire JSON
json_data = {}
for state, group in df.groupby('State'):
    json_data[state] = group.to_dict(orient='records')

# Sauvegarder le résultat dans un fichier JSON
with open('stations_par_etat.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, indent=4, ensure_ascii=False)

print("Conversion terminée. Le fichier 'stations_par_etat.json' a été créé.")
