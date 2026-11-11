import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { etiquetaEstadoMatricula } from '../nucleo/datos/profesor-regular-context.service';
import { fechaCostaRica } from '../compartidos/utilidades/fechas';

@Component({
  selector: 'app-vista-grupos-profesor',
  imports: [FormsModule],
  template: `
    <section class="groups-page" aria-labelledby="groups-title">
      <header class="surface page-header"><div><p class="eyebrow">Mis asignaciones</p><h2 id="groups-title">Mis grupos</h2><p>Selecciona un grupo para trabajar con sus estudiantes.</p></div><div class="period-tools"><label class="year-select">Curso lectivo<select [ngModel]="grupos.anioConsulta()" (ngModelChange)="cambiarAnio($event)" aria-label="Curso lectivo a consultar">@if (!grupos.anioConsulta()) {<option [ngValue]="null" disabled>Elegir…</option>}@for (anio of grupos.aniosDisponibles(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label><span class="period-chip">{{ grupos.periodoActivo() }}</span></div></header>
      <section class="groups-layout"><section class="surface group-table"><div class="table-head"><strong>Asignatura</strong><strong>Sección</strong><strong>Estudiantes</strong></div>@for (group of grupos.grupos(); track group.id) {<div class="group-row" [class.selected]="selectedId() === group.id"><button type="button" class="group-select" (click)="seleccionar(group)"><strong>{{ group.asignatura }}</strong><span>{{ group.seccion }}</span></button><span>{{ group.estudiantes.length }}</span></div>} @empty {<p class="empty" [class.error-text]="grupos.errorGrupos()">{{ grupos.mensajeSinGrupos() }}</p>}</section><section class="surface student-panel"><div class="panel-heading"><div><p class="eyebrow">Estudiantes del grupo</p><h3>{{ selectedGroup() ? selectedGroup()?.asignatura + ' · ' + selectedGroup()?.seccion : 'Sin grupo seleccionado' }}</h3></div><span>{{ selectedGroup()?.estudiantes?.length ?? 0 }}</span></div><div class="student-list">@for (student of paginatedStudents(); track student.id) {<div><strong>{{ student['nombre'] }}</strong><small>{{ student['cedula'] }} · Matrícula {{ estadoMatricula(student) }}</small></div>} @empty {<p class="empty">{{ selectedGroup() ? 'Este grupo no tiene estudiantes matriculados.' : 'Selecciona un grupo para consultar sus estudiantes.' }}</p>}</div>@if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}</section></section>
    </section>
  `,
  styles: `
    .groups-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.page-header h2,.page-header p:last-child,.panel-heading h3{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.period-tools{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;justify-content:flex-end}.year-select{display:grid;gap:.2rem;color:#667085;font-size:.75rem;font-weight:700}.year-select select{min-height:34px;padding:.3rem .5rem;border:1px solid #cfd9e3;border-radius:6px}.error-text{color:#b42318!important}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#1b6f60;font-size:.78rem;font-weight:700}.groups-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:1rem}.table-head,.group-row{display:grid;grid-template-columns:minmax(0,1fr) 100px 125px;gap:1rem;align-items:center}.table-head{padding:.2rem .8rem .65rem;color:#667085;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.group-row{padding:.65rem .8rem;border-top:1px solid #e6edf3}.group-row.selected{background:#eaf3f8}.group-row span{color:#667085}.group-select{display:grid;gap:.2rem;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.group-select strong{color:#1e3a5f}.group-select span{font-size:.82rem}.group-row .primary-button{justify-self:end;min-height:34px;padding:.35rem .7rem;font-size:.78rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem}.panel-heading>span{color:#667085}.student-list{display:grid;gap:.45rem;margin-top:1rem}.student-list>div{padding:.6rem .7rem;border:1px solid #e6edf3;border-radius:7px}.student-list strong,.student-list small{display:block}.student-list small{margin-top:.18rem;color:#667085;font-size:.78rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty{margin:0;padding:1rem;color:#667085}@media(max-width:800px){.groups-layout{grid-template-columns:1fr}}@media(max-width:650px){.table-head{display:none}.group-row{grid-template-columns:1fr 70px;gap:.4rem}.group-row .primary-button{grid-column:1/-1;justify-self:stretch}}
  `,
})
// Permite al profesor consultar y seleccionar sus grupos de trabajo.
export class GruposProfesorVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  protected readonly selectedId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly selectedGroup = computed(() => this.grupos.grupos().find((group) => group.id === this.selectedId()) ?? this.grupos.grupoActual());
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 5;
  protected readonly paginatedStudents = computed(() => { const students = this.selectedGroup()?.estudiantes ?? []; const start = this.studentPage() * this.pageSize; return students.slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.ceil((this.selectedGroup()?.estudiantes.length ?? 0) / this.pageSize));
  protected seleccionar(group: Parameters<GruposProfesorService['seleccionar']>[0]): void { this.grupos.seleccionar(group); if (typeof group !== 'string' && group) this.selectedId.set(group.id); this.studentPage.set(0); }
  protected cambiarAnio(anio: number): void { this.selectedId.set(''); this.studentPage.set(0); this.grupos.cambiarAnio(anio); }
  // RD-048: estado de la matrícula (y fecha de retiro si aplica).
  protected estadoMatricula(student: Record<string, unknown>): string {
    const estado = etiquetaEstadoMatricula(student['estado']).toLowerCase();
    return student['estado'] === 'RETIRADA' && student['fechaRetiro'] ? `${estado} el ${fechaCostaRica(String(student['fechaRetiro']))}` : estado;
  }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
}
