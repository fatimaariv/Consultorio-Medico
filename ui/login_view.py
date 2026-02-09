import customtkinter as ctk

class LoginView(ctk.CTkFrame):
    def __init__(self, master, al_presionar_entrar):
        super().__init__(master)
        
        ctk.CTkLabel(self, text="INICIO DE SESIÓN", font=("Arial", 24)).pack(pady=40)
        
        self.usuario = ctk.CTkEntry(self, placeholder_text="Usuario médico")
        self.usuario.pack(pady=10)
        
        self.password = ctk.CTkEntry(self, placeholder_text="Contraseña", show="*")
        self.password.pack(pady=10)
        
        # Cuando hace clic, ejecuta la función que le mandó el main.py
        self.btn_entrar = ctk.CTkButton(self, text="Entrar al Sistema", command=al_presionar_entrar)
        self.btn_entrar.pack(pady=20)