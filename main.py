import customtkinter as ctk
from ui.login_view import LoginView
from ui.dashboard_view import DashboardView

class AplicacionConsultorio(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Consultorio Médico - Sistema Nativo")
        self.geometry("900x600")

        # Contenedor principal donde se "montarán" las páginas
        self.contenedor = ctk.CTkFrame(self)
        self.contenedor.pack(expand=True, fill="both")

        self.mostrar_login()

    def mostrar_login(self):
        # Limpiamos el contenedor
        for widget in self.contenedor.winfo_children():
            widget.destroy()
        
        # Cargamos solo el diseño de Login
        # Le pasamos la función 'self.ir_al_dashboard' para que la use el botón
        self.vista_actual = LoginView(self.contenedor, self.ir_al_dashboard)
        self.vista_actual.pack(expand=True, fill="both")

    def ir_al_dashboard(self):
        # Limpiamos login y pasamos al panel principal
        for widget in self.contenedor.winfo_children():
            widget.destroy()
            
        self.vista_actual = DashboardView(self.contenedor)
        self.vista_actual.pack(expand=True, fill="both")

if __name__ == "__main__":
    app = AplicacionConsultorio()
    app.mainloop()