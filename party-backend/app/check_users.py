from sqlmodel import Session, select, create_engine
from app.models.user import SpotifyUser

# Connexion à la base de données
engine = create_engine('sqlite:///./spotify_party.db')
session = Session(engine)

# Récupérer tous les utilisateurs
users = session.exec(select(SpotifyUser)).all()

print(f"\n📊 Nombre d'utilisateurs dans la BDD : {len(users)}\n")

if users:
    print("👥 Liste des utilisateurs :")
    for user in users:
        print(f"  - ID: {user.id}")
        print(f"    Spotify ID: {user.spotify_id}")
        print(f"    Nom: {user.display_name}")
        print(f"    Email: {user.email}")
        print(f"    Access Token: {'✅ Présent' if user.access_token else '❌ Absent'}")
        print()
else:
    print("❌ Aucun utilisateur trouvé dans la base de données !")
    print("\n💡 Solution : Reconnecte-toi avec Spotify")
    print("   1. Va sur http://localhost:3000")
    print("   2. Déconnecte-toi (bouton en haut)")
    print("   3. Reconnecte-toi avec Spotify")
    print("   4. Relance ce script")

session.close()