import customtkinter as ctk

class DashboardView(ctk.CTkFrame):
    def __init__(self, master):
        super().__init__(master)
        
        # Barra lateral de diseño
        self.sidebar = ctk.CTkFrame(self, width=200)
        self.sidebar.pack(side="left", fill="y")
        
        ctk.CTkLabel(self.sidebar, text="MENÚ", font=("Arial", 18)).pack(pady=20)
        ctk.CTkButton(self.sidebar, text="Agenda").pack(pady=10, padx=10)
        ctk.CTkButton(self.sidebar, text="Pacientes").pack(pady=10, padx=10)
        
        # Área de contenido
        self.contenido = ctk.CTkLabel(self, text="Bienvenido al Panel de Control Médico")
        self.contenido.pack(expand=True)