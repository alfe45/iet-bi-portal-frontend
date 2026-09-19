import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';

@Component({
  selector: 'app-vista-grupo-docente',
  imports: [RouterLink],
  template: `
    <section class="group-page" aria-labelledby="group-title">
      <header class="surface group-header">
        <div><a class="back-link" routerLink="/dashboard">← Volver al tablero</a><p class="eyebrow">Periodo activo · {{ period() }}</p><h2 id="group-title">{{ subject() }} · {{ section() }}</h2><p>{{ students().length }} estudiantes · Escala {{ scale() }}</p></div>
      </header>
      <section class="surface" aria-labelledby="group-actions-title"><div class="section-heading"><div><p class="eyebrow">Trabajo del grupo</p><h3 id="group-actions-title">Accesos rápidos</h3></div></div><div class="group-actions">
        <a class="group-action" routerLink="/registro-academico" [queryParams]="contextParams()"><strong>Registro de bandas</strong><span>Registrar valor, ausentismo y observación.</span><b>→</b></a>
        <a class="group-action" [routerLink]="['/estudiantes']" [queryParams]="contextParams()"><strong>Ver estudiantes</strong><span>Consultar los estudiantes de esta sección.</span><b>→</b></a>
      </div></section>
      <section class="surface students"><div class="section-heading"><h3>Estudiantes del grupo</h3><span>{{ students().length }} registrados</span></div><div class="student-list">@for (student of students(); track student.id) { <div><strong>{{ student['nombre'] }}</strong><small>{{ student['cedula'] }}</small></div> } @empty { <p>No hay estudiantes registrados en esta sección.</p> }</div></section>
    </section>
  `,
  styles: `
    .group-page { display: grid; gap: 1rem; align-content: start; }.group-header { border-left: 5px solid #2f6b9a; }.back-link { display: inline-block; margin-bottom: .8rem; color: #2f6b9a; font-size: .82rem; font-weight: 700; text-decoration: none; }.eyebrow { margin: 0 0 .25rem; color: #2f6b9a; font-size: .74rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }.group-header h2,.group-header p:last-child,.section-heading h3 { margin: 0; }.group-header h2 { color: #1e3a5f; }.group-header p:last-child { margin-top: .35rem; color: #667085; }.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }.section-heading > span { color: #667085; font-size: .82rem; }.group-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; margin-top: .8rem; }.group-action { display: grid; gap: .35rem; min-height: 105px; padding: .9rem; border: 1px solid #dbe5ef; border-radius: 9px; color: #1e3a5f; text-decoration: none; }.group-action:hover { border-color: #4099ff; box-shadow: 0 5px 14px rgba(27,46,94,.1); }.group-action span { color: #667085; font-size: .8rem; line-height: 1.35; }.group-action b { align-self: end; color: #4099ff; }.student-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; margin-top: .8rem; }.student-list > div { padding: .65rem .75rem; border: 1px solid #e6edf3; border-radius: 7px; }.student-list strong,.student-list small { display: block; }.student-list small { margin-top: .2rem; color: #667085; font-size: .8rem; }.students p { color: #667085; }@media(max-width:900px){.student-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.group-actions,.student-list{grid-template-columns:1fr}}
  `,
})
// Muestra el detalle académico de un grupo docente.
export class GrupoDocenteVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly datos = inject(PortalDatosService);
  private readonly contexto = inject(GruposProfesorService);
  private readonly query = this.route.snapshot.queryParamMap;
  protected readonly subject = computed(() => this.query.get('asignatura') ?? 'Asignatura');
  protected readonly section = computed(() => this.query.get('seccion') ?? 'Sección');
  protected readonly period = computed(() => this.query.get('periodo') ?? 'Periodo activo');
  protected readonly students = computed(() => this.datos.estudiantes().filter((student) => student['seccion'] === this.section()));
  protected readonly scale = computed(() => this.contexto.grupos().find((group) => group.asignatura === this.subject() && group.seccion === this.section())?.escala ?? '-');
  constructor() { this.contexto.seleccionarParametros(this.subject(), this.section(), this.period()); }
  protected contextParams(): Record<string, string> { return { asignatura: this.subject(), seccion: this.section(), periodo: this.period() }; }
}
