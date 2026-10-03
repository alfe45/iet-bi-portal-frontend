import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';
import { Router } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';

@Component({
  selector: 'app-vista-inicio-sesion',
  imports: [FormsModule],
  template: `
    <main class="auth-main bg-grd-primary">
      <section class="auth-card card" aria-labelledby="login-title">
        <div class="card-body">
          <header class="auth-brand"><img src="/logo-mep.jpg" alt="Logo del Ministerio de Educación Pública" /><p>Instituto de Educación</p><h1 id="login-title">Dr. Clodomiro Picado</h1><span>IET BI Portal</span></header>
           <form (ngSubmit)="iniciarSesion()" class="auth-form" [attr.aria-busy]="cargando()">
             <label for="usuario">Correo institucional</label><input id="usuario" class="form-control" type="email" name="usuario" [(ngModel)]="usuario" autocomplete="username" [disabled]="cargando()" required />
             <label for="contrasena">Contraseña</label><input id="contrasena" class="form-control" type="password" name="contrasena" [(ngModel)]="contrasena" autocomplete="current-password" [disabled]="cargando()" required />
             <button type="submit" class="btn btn-primary btn-lg w-100 login-button" [disabled]="cargando()" [attr.aria-label]="cargando() ? 'Iniciando sesión' : 'Iniciar sesión'">Iniciar sesión</button>
           </form>
           <footer>Acceso local de demostración · Segundo semestre 2026</footer>
         </div>
       </section>
       @if(cargando()){<div class="auth-loading" role="status" aria-live="polite" aria-label="Iniciando sesión"><div class="auth-loading-card"><span class="loading-spinner" aria-hidden="true"></span><strong>Iniciando sesión</strong><span>Validando sus credenciales...</span></div></div>}
       @if(error){<div class="auth-feedback" role="presentation"><section class="auth-feedback-card" role="alertdialog" aria-modal="true" aria-labelledby="login-error-title" aria-describedby="login-error-message"><span class="error-mark" aria-hidden="true">!</span><h2 id="login-error-title">No se pudo iniciar sesión</h2><p id="login-error-message">{{ error }}</p><button type="button" class="btn btn-primary accept-button" (click)="aceptarError()">Aceptar</button></section></div>}
     </main>
  `,
   styles: `
      :host{display:block;height:100vh;height:100dvh;overflow:hidden}.auth-main{height:100%;display:grid;place-items:center;padding:1rem;background:linear-gradient(135deg,#2387f5,#73b4ff);position:relative;overflow:hidden}.auth-main::before,.auth-main::after{content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.1)}.auth-main::before{width:360px;height:360px;right:-100px;top:-160px}.auth-main::after{width:280px;height:280px;left:-100px;bottom:-140px}.auth-card{z-index:1;width:min(100%,400px);padding:0;border:0;border-radius:8px;box-shadow:0 12px 40px rgba(4,26,55,.24)}.card-body{padding:1.7rem 2rem}.auth-brand{text-align:center;margin-bottom:1.25rem}.auth-brand img{width:64px;height:64px;object-fit:contain;padding:4px;border:1px solid #edf0f2;border-radius:10px}.auth-brand p{margin:.7rem 0 .1rem;color:#8996a4;font-size:.67rem;letter-spacing:.1em;text-transform:uppercase}.auth-brand h1{margin:0;color:#29344a;font-size:1.25rem;font-weight:600}.auth-brand span{color:#4099ff;font-size:.75rem;font-weight:600}.auth-form{display:grid;gap:.6rem}.auth-form label{font-size:.72rem;font-weight:500;color:#39465f}.assigned-role{margin-top:-.25rem;color:#13775f;font-size:.7rem}.auth-form .btn{margin-top:.45rem;font-size:.82rem;background:linear-gradient(45deg,#4099ff,#73b4ff);border:0}.login-button:disabled{opacity:.78;cursor:wait}.auth-loading,.auth-feedback{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:1rem;background:rgba(10,28,52,.34);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}.auth-loading-card,.auth-feedback-card{display:grid;justify-items:center;gap:.6rem;width:min(100%,280px);padding:2rem 1.5rem;border:1px solid rgba(255,255,255,.7);border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 20px 60px rgba(4,26,55,.3);color:#29344a}.auth-loading-card strong{font-size:1rem}.auth-loading-card>span:last-child{color:#667085;font-size:.78rem}.loading-spinner{width:3rem;height:3rem;border:4px solid #d9e8f7;border-top-color:#2387f5;border-right-color:#4099ff;border-radius:50%;animation:login-spin .75s linear infinite}.auth-feedback-card{border-top:4px solid #d92d20}.error-mark{width:2.6rem;height:2.6rem;display:grid;place-items:center;border-radius:50%;background:#fef3f2;color:#d92d20;font-size:1.5rem;font-weight:800}.auth-feedback-card h2{margin:.2rem 0 0;font-size:1.05rem}.auth-feedback-card p{margin:0;text-align:center;color:#667085;font-size:.82rem;line-height:1.45}.accept-button{width:100%;margin-top:.45rem}.auth-loading-card strong{font-size:1rem}@keyframes login-spin{to{transform:rotate(360deg)}}footer{margin-top:1rem;padding-top:.8rem;border-top:1px solid #edf0f2;text-align:center;color:#8996a4;font-size:.63rem}@media(prefers-reduced-motion:reduce){.loading-spinner{animation:none}}@media(max-height:620px){.card-body{padding:1rem 1.5rem}.auth-brand{margin-bottom:.7rem}.auth-brand img{width:45px;height:45px}.auth-form{gap:.4rem}}
  `,
})
// Controla el formulario de inicio de sesión.
export class InicioSesionVistaComponent {
  protected readonly auth = inject(AutenticacionService);
  private readonly router = inject(Router);
  protected usuario = '';
  protected contrasena = '';
  protected error = '';
  protected readonly cargando = signal(false);

  protected iniciarSesion(): void {
    if (this.cargando()) return;
    this.error = '';
    this.cargando.set(true);
    const inicio = Date.now();
    this.auth.iniciarSesion(this.usuario, this.contrasena).subscribe({
      next: () => timer(this.tiempoRestante(inicio)).subscribe(() => {
        this.cargando.set(false);
        void this.router.navigateByUrl('/dashboard');
      }),
      error: (error: { error?: { mensaje?: string } }) => timer(this.tiempoRestante(inicio)).subscribe(() => {
        this.error = error.error?.mensaje ?? 'No se pudo iniciar sesión. Verifique sus credenciales.';
        this.cargando.set(false);
      }),
    });
  }

  private tiempoRestante(inicio: number): number {
    return Math.max(0, 1500 - (Date.now() - inicio));
  }

  protected aceptarError(): void {
    this.error = '';
  }
}
