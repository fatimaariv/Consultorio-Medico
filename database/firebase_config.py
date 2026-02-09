
import firebase_admin
from firebase_admin import credentials, firestore

def conectar_firebase():
    # Verifica si ya estamos conectados para no repetir
    if not firebase_admin._apps:
        # Aquí pones el nombre del archivo que descargaste
        cred = credentials.Certificate("database/credenciales.json")
        firebase_admin.initialize_app(cred)
    
    return firestore.client()
