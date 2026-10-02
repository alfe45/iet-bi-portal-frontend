import { Component, computed, inject, output } from '@angular/core';
import { AutenticacionService } from '../../nucleo/autenticacion/autenticacion.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="pc-header">
      <div class="brand"><img src="/logo-mep.jpg" alt="Logo del Ministerio de Educación Pública" /><div><strong>Instituto de Educación</strong><span>Dr. Clodomiro Picado</span></div></div>
      <div class="header-actions">
        <button type="button" class="menu-button" aria-label="Abrir menú principal" (click)="menuToggle.emit()"><span></span><span></span><span></span></button>
        <div class="header-spacer"></div>
         <div class="user"><span class="avatar">{{ avatar() }}</span><span class="user__copy"><strong>{{ name() }}</strong><small>{{ username() }}</small></span></div>
        <button type="button" class="logout" (click)="cerrarSesion()" aria-label="Cerrar la sesión actual" title="Cerrar sesión">Salir</button>
      </div>
    </header>
  `,
  styles: `
    :host { display: block; min-width: 0; z-index: 1030; }
    .pc-header { height: 60px; display: grid; grid-template-columns: 245px minmax(0,1fr); color: #fff; background: linear-gradient(to right,#4099ff,#73b4ff); box-shadow: 0 1px 6px rgba(4,26,55,.18); }
    .brand { display: flex; align-items: center; gap: .7rem; padding: 0 1rem; border-right: 1px solid rgba(255,255,255,.18); }
    .brand img { width: 39px; height: 39px; object-fit: contain; border-radius: 8px; background: #fff; padding: 3px; }
     .brand strong,.brand span,.user strong,.user small { display: block; }
     .brand strong { font-size: .88rem; line-height: 1.1; }.brand span { font-size: .76rem; opacity: .82; }
    .header-actions { min-width: 0; display: flex; align-items: center; gap: .85rem; padding: 0 1.25rem; }
      .header-spacer { flex: 1; }.user small { font-size: .72rem; opacity: .8; }.user strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .86rem; }
    .user { min-width: 0; display: flex; align-items: center; gap: .6rem; }.avatar { flex: 0 0 auto; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.35); font-weight: 600; }.user__copy { min-width: 0; max-width: 210px; }
    .logout,.menu-button { height: 38px; border: 1px solid rgba(255,255,255,.32); border-radius: 4px; color: #fff; background: rgba(255,255,255,.12); font-weight: 600; }.logout { padding: 0 .8rem; }.menu-button { display: none; width: 40px; padding: 9px; }.menu-button span { display:block; height:2px; margin:4px 0; background:#fff; }
    @media(max-width:1024px){.pc-header{grid-template-columns:minmax(0,1fr)}.brand{display:none}.menu-button{display:block}.header-actions{padding:0 .9rem}}
     @media(max-width:700px){.user__copy{display:none}.header-actions{gap:.55rem}}
  `,
})
// Muestra la barra superior y las acciones de la sesión actual.
export class HeaderComponent {
  private readonly auth = inject(AutenticacionService);
  menuToggle = output<void>();
  protected readonly name = computed(() => this.auth.currentDisplayName() || 'Usuario');
  protected readonly username = computed(() => this.auth.currentUsername() || 'sin sesión');
  protected readonly avatar = computed(() => this.name().split(' ').map((part) => part[0]).slice(0, 2).join(''));
  protected cerrarSesion(): void { this.auth.cerrarSesion(); }
}
