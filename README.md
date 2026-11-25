# Le voyage de la foi

Carte interactive qui montre comment quatre voyageurs partis de France au XVIIe siècle (un jésuite, un laïc, un militaire et un marchand) perçoivent huit thèmes de leur foi, étape après étape, jusqu'en Asie : France, Turquie, Iran, Inde, Indonésie.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | La page |
| `style.css` | La mise en forme |
| `app.js` | La carte, les onglets, les barres et le tableau |
| `lescheminspossibles.xlsx` | Le fichier Excel source |
| `donnees.js` | Les données lues par le site, **générées** depuis l'Excel |
| `carte.js` | Le fond de carte (Natural Earth, domaine public) |
| `genere_donnees.py` | Le script qui transforme l'Excel en `donnees.js` |

Le site n'a besoin d'aucune installation. Pour le voir sur votre ordinateur, ouvrez `index.html` dans un navigateur.

## Mettre le site en ligne avec GitHub Pages

1. Créez un dépôt sur GitHub (par exemple `voyage-de-la-foi`).
2. Déposez-y tous les fichiers (bouton **Add file › Upload files**).
3. Allez dans **Settings › Pages**.
4. Dans **Build and deployment**, choisissez **Source : Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`. Cliquez sur **Save**.
5. Après une ou deux minutes, le site est en ligne à l'adresse `https://<votre-identifiant>.github.io/voyage-de-la-foi/`.

GitHub Pages est gratuit pour un dépôt public. Pour un dépôt privé, il faut un compte payant (GitHub Pro).

## Mettre à jour les données

1. Modifiez `lescheminspossibles.xlsx`, en gardant la même structure : un onglet par étape (`En France`, `En Turquie`…), les thèmes en colonne C à partir de la ligne 4, les quatre voyageurs en colonnes D à G.
2. Régénérez le fichier de données :

   ```bash
   pip install openpyxl
   python genere_donnees.py
   ```

3. Envoyez le nouveau `donnees.js` (et l'Excel) sur GitHub. Le site se met à jour tout seul.

## Ajouter une étape

Dans `genere_donnees.py`, ajoutez une ligne à la liste `ETAPES` : le nom de l'onglet Excel, le nom du pays dans la feuille « Les chemins possibles », la ville, et sa position sur la carte :

- x = (longitude + 20) × 6,25
- y = (62 − latitude) × 6,25

Pour que le pays s'éclaire au survol, il faut aussi ajouter son tracé dans `carte.js`. Demandez-le à Claude si besoin.
