"""
Génère donnees.js à partir du fichier Excel « lescheminspossibles.xlsx ».

À lancer depuis la racine du dépôt, après chaque modification de l'Excel :

    pip install openpyxl
    python genere_donnees.py

Le site lit ensuite donnees.js (aucune autre manipulation n'est nécessaire).
"""

import json
from pathlib import Path

import openpyxl

RACINE = Path(__file__).resolve().parent
EXCEL = RACINE / "lescheminspossibles.xlsx"
SORTIE = RACINE / "donnees.js"

# Les 4 colonnes de chiffres, dans l'ordre de l'Excel (colonnes D à G).
VOYAGEURS = ["Jésuite", "Laïc", "Militaire", "Marchand"]

# Les étapes affichées, dans l'ordre des onglets du site.
# - onglet : nom de la feuille Excel qui contient les pourcentages
# - pays_excel : début du nom du pays dans la feuille « Les chemins possibles »
#   (sert à récupérer les religions rencontrées)
# - x, y : position de la ville sur la carte
#   (x = (longitude + 20) * 6.25 ; y = (62 - latitude) * 6.25)
# - zoom : niveau de zoom de la carte quand l'étape est affichée
ETAPES = [
    {"id": "fr", "pays": "France", "ville": "Paris", "epoque": "Royaume de France",
     "onglet": "En France", "pays_excel": "France", "x": 139, "y": 82, "zoom": 2.6},
    {"id": "tr", "pays": "Turquie", "ville": "Constantinople", "epoque": "Empire ottoman",
     "onglet": "En Turquie", "pays_excel": "Turquie", "x": 306, "y": 131, "zoom": 1.9},
    {"id": "ir", "pays": "Iran", "ville": "Ispahan", "epoque": "Perse safavide",
     "onglet": "En Iran", "pays_excel": "Iran (alors Perse safavide, hors", "x": 448, "y": 183, "zoom": 2.0},
    {"id": "in", "pays": "Inde", "ville": "Surate", "epoque": "Empire moghol et royaumes du Sud",
     "onglet": "En Inde", "pays_excel": "Inde", "x": 580, "y": 255, "zoom": 1.9},
    {"id": "id", "pays": "Indonésie", "ville": "Batavia", "epoque": "Java, comptoir hollandais",
     "onglet": "En Indonésie", "pays_excel": "Indonésie", "x": 793, "y": 426, "zoom": 1.7},
]


def texte(valeur):
    return str(valeur).strip() if valeur is not None else ""


def lire_religions(classeur):
    """Renvoie {nom du pays dans l'Excel: [religions]} depuis la 1re feuille."""
    feuille = classeur["Les chemins possibles"]
    religions = {}
    for ligne in feuille.iter_rows(min_col=3, max_col=5, values_only=True):
        pays, _ville, rel = (texte(v) for v in ligne)
        if pays and pays != "PAYS" and pays not in religions:
            religions[pays] = [r.strip() for r in rel.split("\n") if r.strip()]
    return religions


def lire_onglet(classeur, nom):
    """Renvoie (thèmes, valeurs[thème][voyageur], hypothèses) pour un onglet d'étape."""
    feuille = classeur[nom]
    themes, valeurs, hypotheses = [], [], []
    for ligne in feuille.iter_rows(min_row=4, max_row=feuille.max_row, min_col=3, max_col=10, values_only=True):
        theme = texte(ligne[0])
        if not theme:
            continue
        chiffres = ligne[1:5]
        if any(c is None for c in chiffres):
            raise ValueError(f"Onglet « {nom} », thème « {theme} » : une valeur est vide.")
        themes.append(theme[0].upper() + theme[1:])
        valeurs.append([round(float(c)) for c in chiffres])
        if texte(ligne[7]):
            hypotheses.append(texte(ligne[7]))
    return themes, valeurs, hypotheses


def main():
    classeur = openpyxl.load_workbook(EXCEL, data_only=True)
    religions = lire_religions(classeur)

    themes_ref, hypotheses_ref = None, []
    etapes = []
    for etape in ETAPES:
        themes, valeurs, hypotheses = lire_onglet(classeur, etape["onglet"])
        if themes_ref is None:
            themes_ref, hypotheses_ref = themes, hypotheses
        elif themes != themes_ref:
            raise ValueError(f"Onglet « {etape['onglet']} » : les thèmes ne sont pas les mêmes qu'en France.")

        pays_trouve = next((p for p in religions if p.startswith(etape["pays_excel"])), None)
        if pays_trouve is None:
            print(f"Attention : pays « {etape['pays_excel']} » introuvable dans la 1re feuille.")

        etapes.append({
            "id": etape["id"], "pays": etape["pays"], "ville": etape["ville"],
            "epoque": etape["epoque"], "x": etape["x"], "y": etape["y"], "zoom": etape["zoom"],
            "religions": religions.get(pays_trouve, []),
            "valeurs": valeurs,
        })

    donnees = {
        "source": EXCEL.name,
        "voyageurs": VOYAGEURS,
        "themes": themes_ref,
        "hypotheses": hypotheses_ref,
        "etapes": etapes,
    }
    SORTIE.write_text(
        "// Fichier généré par genere_donnees.py. Ne pas modifier à la main.\n"
        "window.DONNEES = " + json.dumps(donnees, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"{SORTIE.relative_to(RACINE)} écrit : {len(etapes)} étapes, {len(themes_ref)} thèmes.")


if __name__ == "__main__":
    main()
