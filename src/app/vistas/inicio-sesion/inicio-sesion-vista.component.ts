import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutenticacionService } from '../../nucleo/autenticacion/autenticacion.service';
import { RolUsuario } from '../../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-vista-inicio-sesion',
  imports: [FormsModule],
  template: `
    <section class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <img class="login-brand__logo" src="/logo-mep.jpg" alt="Logo del Ministerio de Educación Pública" />
          <div>
            <p class="eyebrow">Instituto de Educación Dr. Clodomiro Picado</p>
            <h1>IET BI Portal</h1>
          </div>
        </div>

         <form class="login-form" (ngSubmit)="iniciarSesion()">
          <label>
            <span>Usuario</span>
            <input name="usuario" autocomplete="username" placeholder="Ingrese su usuario" readonly />
          </label>

          <label>
            <span>Contraseña</span>
            <input type="password" name="contrasena" autocomplete="current-password" placeholder="Ingrese su contraseña" readonly />
          </label>

          <label>
            <span>Rol de acceso</span>
            <select name="rol" [(ngModel)]="rol" aria-describedby="role-help">
              @for (item of roles; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
            <small id="role-help">Seleccione el rol para continuar.</small>
          </label>

          <button type="submit" class="primary-button login-button">Iniciar sesión</button>
          </form>
      </div>
    </section>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      background:
        radial-gradient(circle at top right, rgba(47, 107, 154, 0.22), transparent 30%),
        linear-gradient(160deg, #f5f7fa 0%, #eaf3f8 100%);
    }

    .login-card {
      width: min(100%, 980px);
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1.5rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(47, 107, 154, 0.12);
      border-radius: 18px;
      box-shadow: 0 28px 90px rgba(30, 58, 95, 0.15);
      backdrop-filter: blur(20px);
    }

    .login-brand {
      display: grid;
      gap: 1.2rem;
      min-width: 0;
      padding: 2rem;
      border-radius: 14px;
      color: #fff;
      background: linear-gradient(135deg, #1e3a5f, #2f6b9a 65%, #5398cb);
      align-content: center;
    }

    .login-brand__mark {
      display: none;
    }

    .login-brand__logo {
      width: 88px;
      height: 88px;
      object-fit: contain;
      border-radius: 22px;
      background: #fff;
      padding: 0.45rem;
    }

    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; }
    .login-brand h1, .eyebrow { margin: 0; }
    .login-brand h1 { font-size: clamp(1.35rem, 2.1vw, 1.7rem); line-height: 1.1; white-space: nowrap; letter-spacing: -0.035em; }

    .login-form { display: grid; gap: 1rem; align-content: center; padding: 1rem; }
    .login-form label { display: grid; gap: 0.45rem; font-weight: 600; }
    .login-form small { color: #667085; font-weight: 400; }
    .login-button { margin-top: 0.5rem; min-height: 48px; }

    @media (max-width: 900px) {
      .login-card { grid-template-columns: 1fr; }
      .login-brand { padding: 1.5rem; }
    }

    @media (max-width: 560px) {
      .login-page { padding: 1rem; }
      .login-card { padding: 0.75rem; }
      .login-brand h1 { white-space: normal; font-size: 1.65rem; }
    }
  `,
})
export class InicioSesionVistaComponent {
   protected readonly auth = inject(AutenticacionService);

   protected readonly roles: RolUsuario[] = ['Administrador', 'Profesor regular', 'Profesor Guía', 'Coordinador de monografía'];

   protected rol: RolUsuario = 'Administrador';

   protected iniciarSesion(): void {
     this.auth.iniciarComoRol(this.rol);
   }

}
