import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EstudianteApi, EstudiantesApiService } from '../nucleo/api/estudiantes-api.service';
import { MatriculaApi, MatriculasApiService } from '../nucleo/api/matriculas-api.service';

@Component({
  selector: 'app-historial-estudiante-vista',
  imports: [RouterLink],
  template: `
    <section class="page-grid">
      <header class="surface page-header">
        <div><p class="eyebrow">Estudiantes</p><h2>Historial académico</h2><p>Consulta las matrículas registradas para este estudiante.</p></div>
        <a class="ghost-button" routerLink="/estudiantes">Volver a estudiantes</a>
      </header>
      @if (error()) { <p class="api-error" role="alert">{{ error() }}</p> }
      @if (student(); as item) {
        <section class="surface profile-card">
          <div class="profile-avatar">{{ initials(item) }}</div>
          <div><p class="eyebrow">Perfil del estudiante</p><h3>{{ fullName(item) }}</h3><p>{{ item.cedula }} · {{ item.email }}</p></div>
          <dl><div><dt>Fecha de nacimiento</dt><dd>{{ dateLabel(item.fechaNacimiento) }}</dd></div><div><dt>Fecha de registro</dt><dd>{{ dateLabel(item.fechaRegistro) }}</dd></div></dl>
        </section>
      }
      <section class="surface history-card">
        <div class="section-heading"><div><h3>Matrículas</h3><p>{{ matriculas().length }} registro(s) encontrado(s).</p></div></div>
        <div class="history-list">
          @for (item of matriculas(); track item.anio) {
            <article class="history-row"><div><strong>Curso lectivo {{ item.anio }}</strong><span>Sección {{ item.seccion }}</span></div><div><small>Fecha de matrícula</small><strong>{{ dateLabel(item.fechaMatricula) }}</strong></div><span class="status" [class.status--inactive]="item.estado !== 'ACTIVA'">{{ item.estado }}</span>@if (item.fechaRetiro) { <div><small>Retiro</small><strong>{{ dateLabel(item.fechaRetiro) }}</strong></div> }</article>
          } @empty { <p class="empty-state">Este estudiante todavía no tiene matrículas registradas.</p> }
        </div>
      </section>
    </section>
  `,
  styles: `
    :host{display:block;height:100%}.page-grid{display:grid;gap:1rem;min-height:100%}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.page-header h2,.profile-card h3{margin:0}.page-header p:not(.eyebrow),.profile-card p:not(.eyebrow),.section-heading p{margin:.35rem 0 0;color:#667085}.profile-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem}.profile-avatar{display:grid;place-items:center;width:3.5rem;height:3.5rem;border-radius:1rem;background:#e5f2f7;color:#1e5a78;font-weight:800}.profile-card dl{display:flex;gap:1.5rem;margin:0}.profile-card dt,.history-row small{color:#667085;font-size:.7rem}.profile-card dd{margin:.15rem 0 0;font-weight:700;font-size:.8rem}.history-card{min-height:0}.history-list{display:grid;gap:.55rem}.history-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;gap:1rem;padding:.8rem 0;border-bottom:1px solid #edf0f2}.history-row:last-child{border-bottom:0}.history-row div{display:grid;gap:.18rem}.history-row span{color:#667085;font-size:.76rem}.status{padding:.28rem .5rem;border-radius:999px;background:#e8f8f4;color:#168d76;font-size:.68rem;font-weight:800}.status--inactive{background:#fff0f1;color:#d63854}.api-error{padding:.75rem 1rem;color:#b42318;background:#fff1f0;border:1px solid #f3c7c2;border-radius:7px}.empty-state{padding:2rem;text-align:center;color:#667085}@media(max-width:700px){.page-header,.profile-card{align-items:flex-start;flex-direction:column}.profile-card{display:flex}.profile-card dl{flex-wrap:wrap}.history-row{grid-template-columns:1fr 1fr}.history-row .status{justify-self:start}}
  `,
})
export class HistorialEstudianteVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly estudiantesApi = inject(EstudiantesApiService);
  private readonly matriculasApi = inject(MatriculasApiService);
  protected readonly student = signal<EstudianteApi | null>(null);
  protected readonly matriculas = signal<MatriculaApi[]>([]);
  protected readonly error = signal('');

  constructor() {
    const cedula = this.route.snapshot.paramMap.get('cedula') ?? '';
    forkJoin({ student: this.estudiantesApi.obtener(cedula), history: this.matriculasApi.listar({ cedulaEstudiante: cedula, tamanoPagina: 100 }) }).subscribe({
      next: ({ student, history }) => { this.student.set(student); this.matriculas.set(history.elementos); },
      error: () => this.error.set('No se pudo consultar el historial del estudiante.'),
    });
  }

  protected fullName(item: EstudianteApi): string { return [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '); }
  protected initials(item: EstudianteApi): string { return [item.nombre, item.primerApellido].map((part) => part.charAt(0)).join('').toUpperCase(); }
  protected dateLabel(value: string | null | undefined): string { if (!value) return 'No registrado'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(date); }
}
