import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertaTableroApi, TableroAdminApi, TableroApiService } from '../nucleo/api/tablero-api.service';
import { fechaCostaRica } from '../compartidos/utilidades/fechas';

interface AlertaVista { nivel: AlertaTableroApi['nivel']; titulo: string; texto: string; ruta: string; accion: string; detalle: string[] }

const SEMESTRES: Record<string, string> = { I_SEMESTRE: 'I semestre', II_SEMESTRE: 'II semestre' };
const ESTADOS: Record<string, string> = { PROGRAMADO: 'Programado', EN_CURSO: 'En curso', FINALIZADO: 'Finalizado' };

// Tablero del Administrador (RP-62): números clave, alertas con enlace, gráficos y actividad reciente del curso lectivo.
// Los gráficos son SVG/CSS propios (sin librería) y cada uno tiene su texto para lectores de pantalla.
@Component({
  selector: 'app-tablero-admin',
  imports: [RouterLink],
  template: `
    <section class="surface admin-hero">
      <div><p class="eyebrow">Administrador</p><h2 id="dashboard-title">Control institucional</h2>
        @if (datos()?.periodo; as p) {
          <p class="hero-sub">Curso lectivo {{ p.anio }} · {{ estado(p.estado) }}@if (p.semestreActual) { · {{ semestre(p.semestreActual) }}}
            @if (p.diasParaFinSemestre !== null) { · <strong>{{ textoDias(p.diasParaFinSemestre) }} para el fin del semestre</strong> }</p>
        } @else { <p class="hero-sub">Resumen del curso lectivo.</p> }
      </div>
      <div class="hero-actions">
        @if ((datos()?.aniosDisponibles?.length ?? 0) > 1) {
          <label>Año<select [value]="datos()?.periodo?.anio ?? ''" (change)="cambiarAnio($any($event.target).value)" aria-label="Año del curso lectivo">
            @for (anio of datos()!.aniosDisponibles; track anio) { <option [value]="anio">{{ anio }}</option> }
          </select></label>
        }
        <button type="button" class="ghost-button" [disabled]="cargando()" (click)="cargar()">Actualizar</button>
      </div>
    </section>

    @if (cargando() && !datos()) {
      <section class="surface state" aria-live="polite">Cargando el resumen…</section>
    } @else if (error()) {
      <section class="surface state state--error" role="alert"><p>{{ error() }}</p><button type="button" class="primary-button" (click)="cargar()">Reintentar</button></section>
    } @else if (datos(); as d) {
      @if (!d.periodo) {
        <section class="surface state"><p>Todavía no hay cursos lectivos registrados.</p><a class="primary-button" routerLink="/periodos">Registrar curso lectivo</a></section>
      } @else {

        <div class="board">
          <section class="kpi-grid area-kpis" aria-label="Números clave">
            <a class="kpi kpi--blue" routerLink="/matriculas"><span class="kpi-label">Estudiantes</span><strong>{{ d.estudiantes?.matriculados ?? 0 }}</strong><small>matriculados · {{ d.estudiantes?.nivel11 ?? 0 }} en 11 y {{ d.estudiantes?.nivel12 ?? 0 }} en 12 · {{ d.estudiantes?.retirados ?? 0 }} retiros</small></a>
            <a class="kpi kpi--teal" routerLink="/secciones"><span class="kpi-label">Secciones</span><strong>{{ d.secciones?.total ?? 0 }}</strong><small [class.warn]="(d.secciones?.sinGuia ?? 0) > 0">{{ d.secciones?.sinGuia ? d.secciones!.sinGuia + ' sin profesor guía' : 'todas con profesor guía' }}</small></a>
            <a class="kpi kpi--indigo" routerLink="/profesores"><span class="kpi-label">Profesores</span><strong>{{ d.profesores?.activos ?? 0 }}</strong><small>con cuenta activa · {{ d.profesores?.sinAsignacion ?? 0 }} sin carga en el año@if (d.profesores?.inactivos) { · {{ d.profesores!.inactivos }} inactivos }</small></a>
            <a class="kpi kpi--gold" routerLink="/asignaciones"><span class="kpi-label">Carga docente</span><strong>{{ d.cargaDocente?.asignaciones ?? 0 }}</strong><small [class.warn]="(d.cargaDocente?.seccionesSinAsignaciones ?? 0) > 0">asignaciones · {{ d.cargaDocente?.seccionesSinAsignaciones ?? 0 }} secciones sin asignaturas</small></a>
            <div class="kpi kpi--green"><span class="kpi-label">Notas · {{ semestre(d.periodo.semestreNotas) }}</span><strong>{{ porcentajeConfirmadas() }}%</strong><small>confirmadas ({{ d.notas?.confirmadas ?? 0 }} de {{ d.notas?.asignaciones ?? 0 }} asignaciones)</small><span class="meter" aria-hidden="true"><span [style.width.%]="porcentajeConfirmadas()"></span></span></div>
            <a class="kpi kpi--purple" routerLink="/asignaciones-monografia"><span class="kpi-label">Monografías</span><strong>{{ d.monografias?.enCurso ?? 0 }}</strong><small>en curso · {{ d.monografias?.terminadas ?? 0 }} terminadas</small></a>
          </section>
          <section class="surface panel area-actividad" aria-labelledby="actividad-title">
            <div class="panel-head"><h3 id="actividad-title">Actividad reciente</h3></div>
            <ul class="activity">
              @for (item of d.actividad; track $index) {
                <li><span class="act-dot" aria-hidden="true"></span><div class="act-copy"><strong>{{ accion(item.accion) }}</strong>@if (item.registro) { <span class="act-reg">{{ registro(item.registro) }}</span> }
                  <small>{{ item.usuario || 'Sistema' }}</small></div><time>{{ hace(item.fecha) }}</time></li>
              } @empty { <li class="empty">Sin actividad registrada.</li> }
            </ul>
          </section>
          <section class="surface panel area-alertas" aria-labelledby="alertas-title">
            <div class="panel-head"><h3 id="alertas-title">Requiere atención @if (alertas().length) { <span class="count">{{ alertas().length }}</span> }</h3>
              <ul class="sev-legend" aria-label="Severidad"><li><i class="sev-prioridad"></i>Urgente</li><li><i class="sev-aviso"></i>Atención</li><li><i class="sev-info"></i>Informativo</li></ul></div>
            @if (alertas().length) {
              <ul class="alert-list">
                @for (a of alertas(); track a.titulo) {
                  <li class="alert" [class.alert--prioridad]="a.nivel === 'PRIORIDAD'" [class.alert--info]="a.nivel === 'INFO'">
                    <span class="sev-dot" [attr.title]="severidad(a.nivel)" aria-hidden="true"></span>
                    <div class="alert-copy"><strong>{{ a.titulo }}</strong><span class="sr-only"> ({{ severidad(a.nivel) }})</span> <span class="alert-text">{{ a.texto }}</span>
                      @if (a.detalle.length) { <details><summary>Ver detalle</summary><ul>@for (linea of a.detalle; track $index) { <li>{{ linea }}</li> }</ul></details> }
                    </div>
                    @if (a.ruta) { <a class="alert-link" [routerLink]="a.ruta">{{ a.accion }} →</a> }
                  </li>
                }
              </ul>
            } @else { <p class="ok">✓ Todo en orden: no hay pendientes para el curso lectivo {{ d.periodo.anio }}.</p> }
          </section>

          <section class="surface panel area-notas" aria-labelledby="notas-title">
            <div class="panel-head"><h3 id="notas-title">Notas · {{ semestre(d.periodo.semestreNotas) }}</h3><span class="muted">{{ d.notas?.asignaciones ?? 0 }} asignaciones</span></div>
            <div class="donut-wrap">
              <div class="donut" [style.background]="fondoDona()" role="img" [attr.aria-label]="porcentajeConfirmadas() + '% de las asignaciones con notas confirmadas'"><div class="donut-hole"><strong>{{ porcentajeConfirmadas() }}%</strong><small>confirmadas</small></div></div>
              <ul class="donut-legend">
                <li><i class="c-ok"></i>Confirmadas<b>{{ d.notas?.confirmadas ?? 0 }}</b></li>
                <li><i class="c-mid"></i>Completas sin confirmar<b>{{ d.notas?.completasSinConfirmar ?? 0 }}</b></li>
                <li><i class="c-bad"></i>Incompletas<b>{{ d.notas?.incompletas ?? 0 }}</b></li>
              </ul>
            </div>
            @for (n of d.notas?.porNivel ?? []; track n.nivel) {
              <div class="stack-row" role="img" [attr.aria-label]="'Nivel ' + n.nivel + ': ' + n.confirmadas + ' confirmadas, ' + n.completasSinConfirmar + ' completas sin confirmar y ' + n.incompletas + ' incompletas'">
                <span class="row-label">Nivel {{ n.nivel }}</span>
                <span class="stack">
                  @if (n.confirmadas) { <span class="c-ok" [style.flex-grow]="n.confirmadas">{{ n.confirmadas }}</span> }
                  @if (n.completasSinConfirmar) { <span class="c-mid" [style.flex-grow]="n.completasSinConfirmar">{{ n.completasSinConfirmar }}</span> }
                  @if (n.incompletas) { <span class="c-bad" [style.flex-grow]="n.incompletas">{{ n.incompletas }}</span> }
                </span>
              </div>
            } @empty { <p class="empty">No hay asignaciones en el año.</p> }
          </section>

          <section class="surface panel area-mono" aria-labelledby="monografias-title">
            <div class="panel-head"><h3 id="monografias-title">Monografías por cohorte</h3></div>
            <div class="mini-stats"><span><b>{{ d.monografias?.enCurso ?? 0 }}</b>en curso</span><span><b>{{ d.monografias?.terminadas ?? 0 }}</b>terminadas</span></div>
            <div class="legend" aria-hidden="true"><span><i class="c-gold"></i>Capacitación</span><span><i class="c-purple"></i>Investigación</span><span><i class="c-ok"></i>Terminada</span></div>
            @for (c of d.monografias?.porCohorte ?? []; track c.cohorte) {
              <div class="stack-row" role="img" [attr.aria-label]="'Cohorte ' + c.cohorte + ': ' + c.capacitacion + ' en capacitación, ' + c.investigacion + ' en investigación y ' + c.terminada + ' terminadas'">
                <span class="row-label">{{ c.cohorte }}</span>
                <span class="stack">
                  @if (c.capacitacion) { <span class="c-gold" [style.flex-grow]="c.capacitacion">{{ c.capacitacion }}</span> }
                  @if (c.investigacion) { <span class="c-purple" [style.flex-grow]="c.investigacion">{{ c.investigacion }}</span> }
                  @if (c.terminada) { <span class="c-ok" [style.flex-grow]="c.terminada">{{ c.terminada }}</span> }
                </span>
              </div>
            } @empty { <p class="empty">No hay monografías de las cohortes que cursan el año.</p> }
          </section>

          <section class="surface panel area-matricula" aria-labelledby="matricula-title">
            <div class="panel-head"><h3 id="matricula-title">Matrícula por sección</h3></div>
            <div class="legend" aria-hidden="true"><span><i class="c-blue"></i>Matriculados</span><span><i class="c-gray"></i>Retirados</span></div>
            @for (s of d.matriculaPorSeccion ?? []; track s.seccion) {
              <div class="bar-row" role="img" [attr.aria-label]="'Sección ' + s.seccion + ': ' + s.activos + ' matriculados y ' + s.retirados + ' retirados; guía: ' + (s.guia || 'sin asignar')">
                <span class="row-label">{{ s.seccion }}</span>
                <span class="bar-track"><span class="c-blue" [style.width.%]="ancho(s.activos)"></span><span class="c-gray" [style.width.%]="ancho(s.retirados)"></span></span>
                <span class="bar-value">{{ s.activos }}@if (s.retirados) { <small>+{{ s.retirados }}</small> }</span>
                <span class="bar-guide" [class.warn]="!s.guia">{{ s.guia ? 'Guía: ' + s.guia : 'Sin guía' }}</span>
              </div>
            } @empty { <p class="empty">No hay secciones en el año.</p> }
          </section>

          <section class="surface panel area-ausentismo" aria-labelledby="ausentismo-title">
            <div class="panel-head"><h3 id="ausentismo-title">Ausentismo · {{ semestre(d.periodo.semestreNotas) }}</h3></div>
            <p class="note">Ausencias injustificadas por lección (las 5 secciones más altas).</p>
            @for (s of d.ausentismo ?? []; track s.seccion) {
              <div class="bar-row" role="img" [attr.aria-label]="'Sección ' + s.seccion + ': ' + (s.injustificadasPorLeccion ?? 0) + ' ausencias injustificadas por lección; ' + s.injustificadas + ' injustificadas, ' + s.justificadas + ' justificadas y ' + s.tardias + ' tardías en ' + s.lecciones + ' lecciones'">
                <span class="row-label">{{ s.seccion }}</span>
                <span class="bar-track"><span class="c-red" [style.width.%]="anchoAusentismo(s.injustificadasPorLeccion)"></span></span>
                <span class="bar-value">{{ s.injustificadasPorLeccion ?? 0 }}</span>
                <span class="bar-guide">{{ s.injustificadas }} injust. · {{ s.justificadas }} just. · {{ s.tardias }} tardías · {{ s.lecciones }} lecciones</span>
              </div>
            } @empty { <p class="empty">Todavía no hay lecciones registradas en el semestre.</p> }
          </section>

        </div>
      }
    }
  `,
  styles: `
    :host { display: grid; gap: 1rem; }
    h2, h3, p { margin: 0; }
    .eyebrow { margin: 0 0 .25rem; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; color: #2f6b9a; font-weight: 700; }
    .admin-hero { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-left: 5px solid #2f6b9a; }
    .hero-sub { margin-top: .35rem; color: #667085; }.hero-sub strong { color: #1e3a5f; }
    .hero-actions { display: flex; align-items: end; gap: .6rem; }.hero-actions label { display: grid; gap: .2rem; font-size: .75rem; font-weight: 700; color: #667085; }
    .hero-actions select { min-width: 6rem; }
    .state { display: grid; justify-items: start; gap: .7rem; color: #667085; }.state--error p { color: #b42318; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
    .kpi { --tono: #2f6b9a; position: relative; display: grid; align-content: start; gap: .2rem; padding: .95rem 1rem .9rem; overflow: hidden; background: #fff; border: 1px solid #dbe5ef; border-radius: 12px; color: #1e3a5f; text-decoration: none; box-shadow: 0 1px 3px rgba(27,46,94,.05); transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
    .kpi::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: var(--tono); }
    a.kpi:hover { border-color: var(--tono); box-shadow: 0 8px 18px rgba(27,46,94,.1); transform: translateY(-1px); }
    .kpi--blue { --tono: #2f6b9a; }.kpi--teal { --tono: #1e7a68; }.kpi--indigo { --tono: #4b5fb0; }.kpi--gold { --tono: #c58b31; }.kpi--green { --tono: #1e7a68; }.kpi--purple { --tono: #8064a2; }
    .kpi-label { color: var(--tono); font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
    .kpi strong { font-size: 2rem; line-height: 1.1; color: #1e3a5f; }
    .kpi small { color: #667085; font-size: .78rem; line-height: 1.35; }.warn { color: #b42318 !important; font-weight: 700; }
    .meter { display: block; height: 6px; margin-top: .35rem; border-radius: 99px; background: #eef2f6; overflow: hidden; }.meter span { display: block; height: 100%; background: var(--tono); border-radius: 99px; }
    .board { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-areas: "kpis kpis actividad" "alertas alertas actividad" "notas mono actividad" "matricula ausentismo actividad"; }
    .area-kpis { grid-area: kpis; }.area-alertas { grid-area: alertas; }.area-notas { grid-area: notas; }.area-mono { grid-area: mono; }
    .area-matricula { grid-area: matricula; }.area-ausentismo { grid-area: ausentismo; }
    /* La actividad no define el alto de las filas: acompaña todo el tablero como columna lateral y desplaza su lista. */
    .area-actividad { grid-area: actividad; height: 0; min-height: 100%; }
    .area-actividad .activity { flex: 1; min-height: 0; overflow-y: auto; padding-right: .25rem; }
    .panel { display: flex; flex-direction: column; gap: .75rem; min-width: 0; padding: 1.05rem 1.15rem; border-radius: 12px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: .6rem; }.panel-head h3 { color: #29344a; font-size: 1.02rem; }
    .muted { color: #8a96a3; font-size: .78rem; font-weight: 700; }
    .count { display: inline-block; min-width: 1.5rem; margin-left: .3rem; padding: .05rem .45rem; border-radius: 99px; background: #fff1f0; color: #b42318; font-size: .74rem; font-weight: 800; text-align: center; vertical-align: 2px; }
    .sev-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .25rem .75rem; color: #667085; font-size: .72rem; font-weight: 700; }
    .sev-legend li { display: flex; align-items: center; gap: .3rem; }.sev-legend i { width: .6rem; height: .6rem; border-radius: 50%; }
    .sev-prioridad { background: #b42318; }.sev-aviso { background: #d29b2d; }.sev-info { background: #2f6b9a; }
    .alert-list { list-style: none; margin: 0; padding: 0; display: grid; }
    .alert { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: .55rem; padding: .5rem .2rem; border-bottom: 1px solid #eef2f6; }
    .alert:last-child { border-bottom: 0; }
    .sev-dot { width: .6rem; height: .6rem; margin-top: .3rem; border-radius: 50%; background: #d29b2d; box-shadow: 0 0 0 3px #fdf3dc; }
    .alert--prioridad .sev-dot { background: #b42318; box-shadow: 0 0 0 3px #fde4e2; }.alert--info .sev-dot { background: #2f6b9a; box-shadow: 0 0 0 3px #e3eef7; }
    .alert-copy { min-width: 0; font-size: .8rem; line-height: 1.35; }.alert-copy strong { color: #29344a; font-size: .84rem; }
    .alert-text { color: #667085; }.alert-text::before { content: '— '; }
    .alert { padding: .4rem .2rem; }
    .alert-copy details { margin-top: .15rem; font-size: .76rem; color: #475467; }.alert-copy summary { cursor: pointer; color: #1769aa; font-weight: 700; }
    .alert-copy details ul { margin: .3rem 0 0; padding-left: 1.1rem; display: grid; gap: .1rem; }
    .alert-link { color: #1769aa; font-size: .76rem; font-weight: 800; text-decoration: none; white-space: nowrap; }.alert-link:hover { text-decoration: underline; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .mini-stats { display: flex; gap: 1.2rem; color: #667085; font-size: .76rem; }.mini-stats b { display: block; color: #1e3a5f; font-size: 1.35rem; line-height: 1.1; }
    .ok { padding: .8rem; border-radius: 8px; background: #ecfdf3; color: #067647; font-weight: 700; }
    .donut-wrap { display: flex; align-items: center; gap: 1.1rem; }
    .donut { flex: 0 0 auto; width: 112px; height: 112px; border-radius: 50%; display: grid; place-items: center; }
    .donut-hole { width: 76px; height: 76px; border-radius: 50%; background: #fff; display: grid; place-content: center; text-align: center; }
    .donut-hole strong { color: #1e3a5f; font-size: 1.3rem; line-height: 1; }.donut-hole small { color: #667085; font-size: .66rem; }
    .donut-legend { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; flex: 1; min-width: 0; font-size: .8rem; color: #475467; }
    .donut-legend li { display: flex; align-items: center; gap: .4rem; }.donut-legend b { margin-left: auto; color: #1e3a5f; }
    .donut-legend i, .legend i { display: inline-block; flex: 0 0 auto; width: .7rem; height: .7rem; border-radius: 3px; }
    .legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; color: #667085; font-size: .76rem; }.legend i { margin-right: .35rem; vertical-align: -1px; }
    .stack-row { display: grid; grid-template-columns: 3.6rem 1fr; align-items: center; gap: .6rem; }
    .row-label { color: #29344a; font-size: .82rem; font-weight: 700; }
    .stack { display: flex; height: 1.5rem; border-radius: 6px; overflow: hidden; background: #eef2f6; }
    .stack > span { display: grid; place-items: center; min-width: 1.6rem; color: #fff; font-size: .74rem; font-weight: 800; }
    .bar-row { display: grid; grid-template-columns: 2.6rem 1fr 2.4rem; align-items: center; column-gap: .6rem; row-gap: .1rem; }
    .bar-track { display: flex; height: .9rem; border-radius: 5px; background: #eef2f6; overflow: hidden; }.bar-track > span { height: 100%; }
    .bar-value { color: #1e3a5f; font-size: .85rem; font-weight: 800; text-align: right; }.bar-value small { color: #8a96a3; font-weight: 700; }
    .bar-guide { grid-column: 2 / -1; color: #667085; font-size: .72rem; }
    .c-ok { background: #1e7a68; }.c-mid { background: #d29b2d; }.c-bad { background: #c95b68; }.c-blue { background: #2f6b9a; }.c-gray { background: #b9c4cf; }
    .c-red { background: #c95b68; }.c-gold { background: #c58b31; }.c-purple { background: #8064a2; }
    .note { color: #8a96a3; font-size: .74rem; }.empty { color: #667085; font-size: .85rem; }
    .activity { list-style: none; margin: 0; padding: 0; display: grid; align-content: start; }
    .activity li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: .55rem; padding: .45rem 0; border-bottom: 1px solid #eef2f6; font-size: .8rem; color: #29344a; }
    .activity li:last-child { border-bottom: 0; }
    .act-copy { min-width: 0; }.act-copy strong { margin-right: .35rem; }.act-reg { color: #475467; overflow-wrap: anywhere; }
    .act-copy small { display: block; margin-top: .05rem; color: #8a96a3; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .activity time { color: #8a96a3; font-size: .72rem; white-space: nowrap; }
    .act-dot { width: .5rem; height: .5rem; margin-top: .35rem; border-radius: 50%; background: #2f6b9a; }
    @media (max-width: 1180px) {
      .board { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "kpis kpis" "alertas actividad" "notas mono" "matricula ausentismo"; }
    }
    @media (max-width: 760px) {
      .board { grid-template-columns: 1fr; grid-template-areas: "kpis" "alertas" "actividad" "notas" "mono" "matricula" "ausentismo"; }
      .area-actividad { height: auto; min-height: 0; }.area-actividad .activity { max-height: 22rem; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.kpi strong { font-size: 1.6rem; }.alert-link { display: inline-flex; align-items: center; min-height: 36px; }
    }
  `,
})
export class TableroAdminComponent {
  private readonly api = inject(TableroApiService);
  protected readonly datos = signal<TableroAdminApi | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  private anio: number | null = null;

  protected readonly porcentajeConfirmadas = computed(() => {
    const n = this.datos()?.notas;
    return n && n.asignaciones ? Math.round((n.confirmadas * 100) / n.asignaciones) : 0;
  });
  // Dona de notas: confirmadas (verde), completas sin confirmar (dorado) e incompletas (rojo), en ese orden.
  protected readonly fondoDona = computed(() => {
    const n = this.datos()?.notas;
    if (!n || !n.asignaciones) return '#eef2f6';
    const a = (n.confirmadas * 100) / n.asignaciones;
    const b = a + (n.completasSinConfirmar * 100) / n.asignaciones;
    return `conic-gradient(#1e7a68 0 ${a}%, #d29b2d ${a}% ${b}%, #c95b68 ${b}% 100%)`;
  });
  private readonly maxMatricula = computed(() => Math.max(1, ...(this.datos()?.matriculaPorSeccion ?? []).map((s) => s.activos + s.retirados)));
  private readonly maxAusentismo = computed(() => Math.max(0.01, ...(this.datos()?.ausentismo ?? []).map((s) => s.injustificadasPorLeccion ?? 0)));
  protected readonly alertas = computed(() => (this.datos()?.alertas ?? []).map((a) => this.alertaVista(a))
    .sort((a, b) => this.orden(a.nivel) - this.orden(b.nivel)));

  constructor() { this.cargar(); }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.obtener(this.anio).subscribe({
      next: (datos) => { this.datos.set(datos); this.cargando.set(false); },
      error: (err: { error?: { mensaje?: string } }) => {
        this.cargando.set(false);
        this.datos.set(null);   // nunca se muestran ceros falsos ante un error
        this.error.set(err?.error?.mensaje ?? 'No se pudo cargar el resumen. Intente de nuevo más tarde.');
      },
    });
  }

  protected cambiarAnio(valor: string): void { this.anio = Number(valor) || null; this.cargar(); }
  protected semestre(valor: string | null): string { return valor ? SEMESTRES[valor] ?? valor : ''; }
  protected estado(valor: string): string { return ESTADOS[valor] ?? valor; }
  protected textoDias(dias: number): string { return dias === 0 ? 'hoy termina' : dias === 1 ? 'falta 1 día' : `faltan ${dias} días`; }
  protected ancho(valor: number): number { return (valor * 100) / this.maxMatricula(); }
  protected anchoAusentismo(valor: number | null): number { return ((valor ?? 0) * 100) / this.maxAusentismo(); }

  // Acción del registro de auditoría en palabras: REGISTRAR_PROFESOR → «Registrar profesor».
  protected accion(codigo: string): string {
    const texto = codigo.toLowerCase().replace(/_/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  // «2026/12-1/HIS/II_SEMESTRE» → «2026 · 12-1 · HIS · II semestre».
  protected registro(valor: string): string {
    return valor.split('/').map((parte) => SEMESTRES[parte] ?? parte).join(' · ');
  }

  protected hace(fecha: string): string {
    const minutos = Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    return fechaCostaRica(fecha);
  }

  protected severidad(nivel: string): string { return nivel === 'PRIORIDAD' ? 'Urgente' : nivel === 'AVISO' ? 'Atención' : 'Informativo'; }
  private orden(nivel: string): number { return nivel === 'PRIORIDAD' ? 0 : nivel === 'AVISO' ? 1 : 2; }

  private alertaVista(a: AlertaTableroApi): AlertaVista {
    const secciones = (a.detalle as string[]).join(', ');
    const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
    switch (a.codigo) {
      case 'SECCIONES_SIN_GUIA':
        return { nivel: a.nivel, titulo: `${a.cantidad} ${plural(a.cantidad, 'sección sin profesor guía', 'secciones sin profesor guía')}`, texto: `Sección ${secciones}.`, ruta: '/asignaciones-guias', accion: 'Asignar guía', detalle: [] };
      case 'SECCIONES_SIN_CAS':
        return { nivel: a.nivel, titulo: `${a.cantidad} ${plural(a.cantidad, 'sección sin profesor CAS', 'secciones sin profesor CAS')}`, texto: `Sección ${secciones}.`, ruta: '/asignaciones-cas', accion: 'Asignar CAS', detalle: [] };
      case 'SIN_COORDINADOR_CAS':
        return { nivel: a.nivel, titulo: 'No hay Coordinador CAS', texto: 'Se asigna en Profesores → «Coordinación».', ruta: '/profesores', accion: 'Ir a Profesores', detalle: [] };
      case 'SIN_COORDINADOR_MONOGRAFIA':
        return { nivel: a.nivel, titulo: 'No hay Coordinador de Monografía', texto: 'Se asigna en Profesores → «Coordinación».', ruta: '/profesores', accion: 'Ir a Profesores', detalle: [] };
      case 'ESTUDIANTES_SIN_MONOGRAFIA':
        return { nivel: a.nivel, titulo: `${a.cantidad} ${plural(a.cantidad, 'estudiante de 11 sin monografía', 'estudiantes de 11 sin monografía')}`, texto: `Secciones ${secciones}.`, ruta: '/asignaciones-monografia', accion: 'Asignar', detalle: [] };
      case 'NOTAS_PENDIENTES': {
        const filas = a.detalle as Array<{ profesor: string; asignatura: string; seccion: string; sinNota: number; estudiantes: number; confirmada: boolean; diasParaCierre: number }>;
        return { nivel: a.nivel, titulo: `${a.cantidad} ${plural(a.cantidad, 'asignación con notas pendientes', 'asignaciones con notas pendientes')}`,
          texto: `Faltan notas o confirmarlas; el plazo cierra ${a.diasParaCierre === 0 ? 'hoy' : `en ${a.diasParaCierre} ${plural(a.diasParaCierre ?? 0, 'día', 'días')}`}.`,
          ruta: '/asignaciones', accion: 'Ver asignaciones',
          detalle: filas.map((f) => `${f.profesor} · ${f.asignatura} ${f.seccion}: ${f.sinNota > 0 ? `${f.sinNota} de ${f.estudiantes} sin nota` : 'completas, sin confirmar'} (cierra en ${f.diasParaCierre} días)`) };
      }
      case 'PRORROGAS_VIGENTES': {
        const filas = a.detalle as Array<{ profesor: string; semestre: string; fechaLimite: string }>;
        return { nivel: a.nivel, titulo: `${a.cantidad} ${plural(a.cantidad, 'prórroga de notas vigente', 'prórrogas de notas vigentes')}`, texto: 'Plazo de notas extendido.', ruta: '', accion: '',
          detalle: filas.map((f) => `${f.profesor} · ${this.semestre(f.semestre)} hasta el ${fechaCostaRica(f.fechaLimite)}`) };
      }
      default:
        return { nivel: a.nivel, titulo: a.codigo, texto: `${a.cantidad}`, ruta: '/dashboard', accion: 'Ver', detalle: [] };
    }
  }
}
