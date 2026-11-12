import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AusentismoSeccionGuiaApi, NotaSeccionGuiaApi, ProfesorGuiaApiService } from '../nucleo/api/profesor-guia-api.service';
import { GuiaConsultaService } from '../nucleo/datos/guia-consulta.service';
import { etiquetaEstadoMatricula } from '../nucleo/datos/profesor-regular-context.service';
import { GuiaCriteriosComponent } from '../compartidos/componentes/guia-criterios.component';

interface GrupoNotas {
  clave: string;
  asignatura: string;
  codigo: string;
  tipo: string;
  profesor: string;
  confirmada: boolean;
  sinNota: number;
  notas: NotaSeccionGuiaApi[];
}

/**
 * Guía CU03/CU04 (notas de la sección, modo "notas") y CU05 (ausentismo de la sección, modo "ausentismo"), RD-055:
 * año, sección y semestre elegibles; cada asignación con su profesor y si sus notas están confirmadas.
 */
@Component({
  selector: 'app-vista-guia-notas',
  imports: [FormsModule, GuiaCriteriosComponent],
  template: `
    <section class="guide-page" [attr.aria-labelledby]="'guide-' + modo + '-title'">
      <header class="surface page-header"><div><p class="eyebrow">Profesor Guía</p><h2 [id]="'guide-' + modo + '-title'">{{ modo === 'notas' ? 'Notas de la sección guía' : 'Ausentismo de la sección guía' }}</h2><p>{{ modo === 'notas' ? 'Notas de cada asignatura con su profesor y el estado de la confirmación.' : 'Lecciones, ausencias y llegadas tardías de cada estudiante por asignatura.' }}</p></div><span class="period-chip">{{ guia.etiqueta() }}</span></header>
      <app-guia-criterios />
      @if (guia.seccionActual()) {
        @if (error()) {<p class="surface empty error-text" role="alert">{{ error() }}</p>}
        @else if (cargando()) {<p class="surface empty">Cargando…</p>}
        @else if (modo === 'notas') {
          <section class="surface filters"><label><small>Asignatura</small><select [ngModel]="filtroAsignatura()" (ngModelChange)="filtroAsignatura.set($event)" aria-label="Filtrar por asignatura"><option value="">Todas</option>@for (grupo of grupos(); track grupo.clave) {<option [value]="grupo.clave">{{ grupo.asignatura }} · {{ grupo.profesor }}</option>}</select></label><span>{{ confirmadas() }} de {{ grupos().length }} asignaturas confirmadas</span></section>
          @if (sinNotasRegistradas()) {<p class="surface empty">Todavía no hay notas registradas para la sección en el semestre consultado.</p>}
          @for (grupo of gruposVisibles(); track grupo.clave) {
            <section class="surface block">
              <div class="block-head"><div><h3>{{ grupo.asignatura }} <small>({{ grupo.codigo }} · {{ tipo(grupo.tipo) }})</small></h3><p>Profesor: {{ grupo.profesor }} · {{ grupo.sinNota === 0 ? 'Todos con nota' : grupo.sinNota + ' sin nota' }}</p></div><span class="badge" [class.badge--ok]="grupo.confirmada">{{ grupo.confirmada ? 'Notas confirmadas' : 'Sin confirmar' }}</span></div>
              <div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Matrícula</th><th>Nota</th><th>Mínima</th><th>Aprueba</th><th>Observaciones</th></tr></thead><tbody>
                @for (n of grupo.notas; track n.cedulaEstudiante) {<tr><td><strong>{{ n.nombreEstudiante }}</strong><small>{{ n.cedulaEstudiante }}</small></td><td>{{ estado(n.estadoMatricula) }}</td><td>{{ n.nota ?? 'Sin nota' }}</td><td>{{ n.notaMinima ?? 'No aplica' }}</td><td>{{ n.aprobada === null ? '—' : n.aprobada ? 'Sí' : 'No' }}</td><td>{{ n.observaciones || '—' }}</td></tr>}
              </tbody></table></div>
            </section>
          } @empty {<p class="surface empty">La sección no tiene notas para mostrar en el semestre consultado.</p>}
        } @else {
          <section class="surface block">
            <div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Asignatura</th><th>Profesor</th><th>Lecciones</th><th>Ausencias</th><th>Justificadas</th><th>Injustificadas</th><th>Tardías</th><th>Ausentismo</th></tr></thead><tbody>
              @for (a of ausentismo(); track a.cedulaEstudiante + a.codigoAsignatura + a.nombreProfesor) {<tr><td><strong>{{ a.nombreEstudiante }}</strong><small>{{ a.cedulaEstudiante }} · {{ estado(a.estadoMatricula) }}</small></td><td>{{ a.asignatura }}</td><td>{{ a.nombreProfesor }}</td><td>{{ a.lecciones }}</td><td>{{ a.ausencias }}</td><td>{{ a.justificadas }}</td><td>{{ a.injustificadas }}</td><td>{{ a.tardias }}</td><td>{{ a.porcentajeAusentismo === null ? 'Sin lecciones' : a.porcentajeAusentismo + ' %' }}</td></tr>}
              @empty {<tr><td colspan="9" class="empty-cell">La sección no tiene estudiantes con asignaturas en el semestre consultado.</td></tr>}
            </tbody></table></div>
          </section>
        }
      }
    </section>
  `,
  styles: `
    .guide-page{display:grid;gap:.2rem;align-content:start}.page-header{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p,.block-head h3,.block-head p{margin:0}.page-header p:last-child{margin-top:.3rem;color:#667085}
    .eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#1b6f60;font-size:.78rem;font-weight:700}
    .filters{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;margin-bottom:1rem;padding:.8rem 1.1rem}.filters label{display:grid;gap:.2rem;color:#667085;font-size:.75rem;font-weight:700}.filters select{min-height:34px;padding:.3rem .5rem;border:1px solid #cfd9e3;border-radius:6px}.filters span{color:#667085;font-size:.85rem}
    .block{padding:1rem 1.15rem;margin-bottom:1rem}.block-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:.6rem}.block-head small{color:#667085;font-weight:400;font-size:.8rem}.block-head p{color:#667085;font-size:.85rem;margin-top:.2rem}
    .badge{padding:.2rem .55rem;border-radius:999px;background:#fff8db;color:#9a6700;font-size:.78rem;font-weight:800;white-space:nowrap}.badge--ok{background:#ecfdf3;color:#067647}
    .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.88rem}th{text-align:left;color:#667085;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;padding:.45rem .5rem;border-bottom:1px solid #e6edf3}td{padding:.5rem;border-bottom:1px solid #eef2f6;vertical-align:top}td small{display:block;color:#667085;font-size:.75rem}.empty-cell{text-align:center;color:#667085;padding:1.4rem}
    .empty{padding:1rem 1.15rem;color:#667085;margin:0 0 1rem}.error-text{color:#b42318!important}
  `,
})
export class GuiaNotasVistaComponent {
  protected readonly guia = inject(GuiaConsultaService);
  private readonly api = inject(ProfesorGuiaApiService);
  protected readonly modo = (inject(ActivatedRoute).snapshot.data['modo'] as 'notas' | 'ausentismo' | undefined) ?? 'notas';
  protected readonly notas = signal<NotaSeccionGuiaApi[]>([]);
  protected readonly ausentismo = signal<AusentismoSeccionGuiaApi[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly filtroAsignatura = signal('');
  private carga = 0;

  // Una asignación por asignatura y profesor (dos profesores pueden impartir la misma asignatura en la sección).
  protected readonly grupos = computed<GrupoNotas[]>(() => {
    const mapa = new Map<string, GrupoNotas>();
    for (const n of this.notas()) {
      const clave = `${n.codigoAsignatura}|${n.nombreProfesor}`;
      const grupo = mapa.get(clave) ?? { clave, asignatura: n.asignatura, codigo: n.codigoAsignatura, tipo: n.tipoAsignatura, profesor: n.nombreProfesor, confirmada: n.confirmada, sinNota: 0, notas: [] };
      grupo.notas.push(n);
      if (n.nota === null && n.estadoMatricula !== 'RETIRADA') grupo.sinNota++;
      grupo.confirmada = grupo.confirmada && n.confirmada;
      mapa.set(clave, grupo);
    }
    return [...mapa.values()];
  });
  /** RV2 PG03/PG04 FA 2: hay asignaturas pero ningún profesor registró notas en el semestre. */
  protected readonly sinNotasRegistradas = computed(() => this.grupos().length > 0 && this.grupos().every((grupo) => grupo.notas.every((n) => n.nota === null)));
  protected readonly gruposVisibles = computed(() => this.grupos().filter((grupo) => !this.filtroAsignatura() || grupo.clave === this.filtroAsignatura()));
  protected readonly confirmadas = computed(() => this.grupos().filter((grupo) => grupo.confirmada).length);

  constructor() {
    effect(() => {
      const consulta = this.guia.consulta();
      untracked(() => {
        const carga = ++this.carga;
        this.notas.set([]);
        this.ausentismo.set([]);
        this.error.set('');
        this.filtroAsignatura.set('');
        if (!consulta) return;
        this.cargando.set(true);
        const fallo = (e: { error?: { mensaje?: string } }) => { if (carga === this.carga) { this.error.set(e?.error?.mensaje ?? 'No se pudo completar la consulta.'); this.cargando.set(false); } };
        if (this.modo === 'notas') this.api.listarNotas(consulta).subscribe({ next: (items) => { if (carga === this.carga) { this.notas.set(items); this.cargando.set(false); } }, error: fallo });
        else this.api.listarAusentismo(consulta).subscribe({ next: (items) => { if (carga === this.carga) { this.ausentismo.set(items); this.cargando.set(false); } }, error: fallo });
      });
    });
  }

  protected estado(value: string): string { return etiquetaEstadoMatricula(value); }
  protected tipo(value: string): string { return ({ SUPERIOR: 'Superior', MEDIO: 'Medio', TRONCAL: 'Troncal', MEP: 'MEP' } as Record<string, string>)[value] ?? value; }
}
