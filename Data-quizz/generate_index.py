import json
from pathlib import Path

ROOT = Path("Data-quizz")

THEMES = {
    "ETV": "ETV",
    "Lancage": "Lancage",
    "PIGVS": "PIGVS"
}


def extraire_infos(fichier_json, theme):
    """
    Lecture d'un fichier procédure
    """

    with open(fichier_json, "r", encoding="utf-8") as f:
        questions = json.load(f)

    nb_questions = len(questions)

    nom_fichier = fichier_json.stem

    version = ""

    morceaux = nom_fichier.split("_")

    if morceaux:
        dernier = morceaux[-1]

        if dernier.startswith("R"):
            version = dernier

    nom = nom_fichier

    if version:
        nom = nom_fichier.replace(f"_{version}", "")

    description = nom.replace("-", " ")

    return {
        "nom": nom,
        "description": description,
        "version": version,
        "fichier": f"{theme}/{fichier_json.name}",
        "nbQuestions": nb_questions
    }


def construire_index():

    index = {
        "ETV": [],
        "Lancage": [],
        "PIGVS": []
    }

    total_questions = 0

    for theme in THEMES:

        dossier = ROOT / theme

        if not dossier.exists():
            print(f"[INFO] dossier absent : {dossier}")
            continue

        for fichier in sorted(dossier.glob("*.json")):

            try:

                info = extraire_infos(
                    fichier,
                    theme
                )

                index[theme].append(info)

                total_questions += info["nbQuestions"]

                print(
                    f"[OK] {fichier.name}"
                    f" ({info['nbQuestions']} questions)"
                )

            except Exception as e:

                print(
                    f"[ERREUR] {fichier.name} : {e}"
                )

    fichier_sortie = ROOT / "index.json"

    with open(
        fichier_sortie,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            index,
            f,
            indent=2,
            ensure_ascii=False
        )

    print()
    print("===================================")
    print("Index généré")
    print(f"Procédures : "
          f"{sum(len(index[t]) for t in index)}")
    print(f"Questions : {total_questions}")
    print(f"Fichier : {fichier_sortie}")
    print("===================================")


if __name__ == "__main__":
    construire_index()