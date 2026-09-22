import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { RolUsuario } from '../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-vista-inicio-sesion',
  imports: [FormsModule],
  template: `
    <main class="auth-main bg-grd-primary">
      <section class="auth-card card" aria-labelledby="login-title">
        <div class="card-body">
          <header class="auth-brand"><img src="/logo-mep.jpg" alt="Logo del Ministerio de Educación Pública" /><p>Instituto de Educación</p><h1 id="login-title">Dr. Clodomiro Picado</h1><span>IET BI Portal</span></header>
          <form (ngSubmit)="iniciarSesion()" class="auth-form">
            <label for="usuario">Usuario</label><input id="usuario" class="form-control" name="usuario" [(ngModel)]="usuario" autocomplete="username" required />
            <label for="contrasena">Contraseña</label><input id="contrasena" class="form-control" type="password" name="contrasena" [(ngModel)]="contrasena" autocomplete="current-password" required />
            <label for="rol">Tipo de acceso</label><select id="rol" class="form-select" name="rol" [(ngModel)]="rol">@for(item of roles;track item){<option [value]="item">{{ item }}</option>}</select>
            @if(error){<div class="alert alert-danger py-2 mb-0" role="alert">Ingrese usuario y contraseña para continuar.</div>}
            <button type="submit" class="btn btn-primary btn-lg w-100">Iniciar sesión</button>
          </form>
          <footer>Acceso local de demostración · Segundo semestre 2026</footer>
        </div>
      </section>
    </main>
  `,
  styles: `
    :host{display:block;height:100vh;height:100dvh;overflow:hidden}.auth-main{height:100%;display:grid;place-items:center;padding:1rem;background:linear-gradient(135deg,#2387f5,#73b4ff);position:relative;overflow:hidden}.auth-main::before,.auth-main::after{content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.1)}.auth-main::before{width:360px;height:360px;right:-100px;top:-160px}.auth-main::after{width:280px;height:280px;left:-100px;bottom:-140px}.auth-card{z-index:1;width:min(100%,400px);padding:0;border:0;border-radius:8px;box-shadow:0 12px 40px rgba(4,26,55,.24)}.card-body{padding:1.7rem 2rem}.auth-brand{text-align:center;margin-bottom:1.25rem}.auth-brand img{width:64px;height:64px;object-fit:contain;padding:4px;border:1px solid #edf0f2;border-radius:10px}.auth-brand p{margin:.7rem 0 .1rem;color:#8996a4;font-size:.67rem;letter-spacing:.1em;text-transform:uppercase}.auth-brand h1{margin:0;color:#29344a;font-size:1.25rem;font-weight:600}.auth-brand span{color:#4099ff;font-size:.75rem;font-weight:600}.auth-form{display:grid;gap:.6rem}.auth-form label{font-size:.72rem;font-weight:500;color:#39465f}.auth-form .btn{margin-top:.45rem;font-size:.82rem;background:linear-gradient(45deg,#4099ff,#73b4ff);border:0}footer{margin-top:1rem;padding-top:.8rem;border-top:1px solid #edf0f2;text-align:center;color:#8996a4;font-size:.63rem}@media(max-height:620px){.card-body{padding:1rem 1.5rem}.auth-brand{margin-bottom:.7rem}.auth-brand img{width:45px;height:45px}.auth-form{gap:.4rem}}
  `,
})
// Controla el formulario de inicio de sesión.
export class InicioSesionVistaComponent {
  protected readonly auth = inject(AutenticacionService);
  protected readonly roles: RolUsuario[] = ['Administrador', 'Profesor regular', 'Profesor Guía', 'Profesor Coordinador de Monografía', 'Profesor CAS', 'Profesor Coordinador de CAS'];
  protected rol: RolUsuario = 'Administrador';
  protected usuario = 'usuario.demostracion';
  protected contrasena = 'demo2026';
  protected error = false;
  protected iniciarSesion(): void { this.error = !this.auth.iniciarSesion(this.usuario, this.contrasena, this.rol); }
}
