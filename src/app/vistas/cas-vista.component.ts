import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CasProfesorApiService, GuardarInformeCasRequest, InformeCasApi, ProgresoCasApi, ExperienciaCasApi } from '../nucleo/api/cas-profesor-api.service';
import { ProfesorRegularApiService } from '../nucleo/api/profesor-regular-api.service';
import { CursosLectivosApiService, PeriodoActualApi } from '../nucleo/api/cursos-lectivos-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

interface SeccionCasRef { anio: number; nivel: number; numero: number; seccion: string; }
interface CasActivityView {
  id: string;
  proyecto: string;
  fechas: string[];
  creatividad: boolean;
  actividad: boolean;
  servicio: boolean;
  resultados: boolean[];
  carpeta: boolean;
  reflexion: boolean;
  pruebas: boolean;
}

interface CasStudentView {
  id: string;
  estudiante: string;
  seccion: string;
  correo: string;
  profesorCas: string;
  periodo: string;
  actividades: CasActivityView[];
  perfil: boolean;
  entrevistaI: boolean;
  entrevistaII: boolean;
  entrevistaIII: boolean;
  entrevistaFinal: boolean;
  observaciones: string;
  tieneInforme?: boolean;
  cargado?: boolean;
  anio?: number;
  semestre?: string;
}
// Estudiante CAS del profesor: datos del API más el estado de carga de su informe.
type EstudianteCas = CasStudentView;
interface CargaCas { refs: SeccionCasRef[]; estudiantes: EstudianteCas[]; }

const OUTCOMES = [
  'Identificar en uno mismo los puntos fuertes y las áreas en que se necesita mejorar.',
  'Mostrar que se han afrontado desafíos y se han desarrollado nuevas habilidades en el proceso.',
  'Mostrar cómo iniciar y planificar una experiencia de CAS.',
  'Mostrar compromiso y perseverancia en las experiencias de CAS.',
  'Mostrar habilidades de trabajo en equipo y reconocer los beneficios del trabajo colaborativo.',
  'Mostrar compromiso con cuestiones de importancia global.',
  'Reconocer y considerar el aspecto ético de las decisiones y las acciones.',
];

@Component({
  selector: 'app-vista-cas',
  imports: [CommonModule, FormsModule],
  template: `
    <main class="cas-page">
      <header class="page-heading"><div><p class="eyebrow">Creatividad · Actividad · Servicio</p><h2>{{ isCoordinator() ? 'Coordinación CAS' : 'Seguimiento CAS' }}</h2></div><span>{{ isCoordinator() ? 'Consulta y generación de informes' : 'Registro de actividades' }}</span></header>

      <section class="cas-layout" style="grid-template-columns:minmax(0,1fr)">
         <section *ngIf="selected() as student" class="panel editor-panel"><div class="table-heading"><div class="student-heading"><div><p class="eyebrow">{{ student.estudiante }} · {{ student.seccion }}</p><h3>Registro de actividades</h3></div><button type="button" class="observations-button" (click)="abrirObservaciones(student)">Observaciones</button></div><div class="cas-filters"><label>Sección<select [ngModel]="selectedSection()" (ngModelChange)="cambiarSeccion($event)"><option *ngIf="!assignedSection()" value="Todas">Todas</option><option *ngFor="let section of sections()" [value]="section">{{ section }}</option></select></label><label>Estudiante<select [ngModel]="selectedId()" (ngModelChange)="seleccionarEstudiante($event)"><option *ngFor="let option of pickerStudents()" [value]="option.id">{{ option.estudiante }}</option></select></label></div></div>
           <div class="table-scroll"><table class="cas-entry-table"><thead><tr><th>#</th><th>Proyecto / experiencia</th><th>Fecha</th><th colspan="3">CAS</th><th *ngFor="let number of outcomeNumbers" class="number-heading"><button type="button" (click)="openOutcome(number - 1)">{{ number }}</button></th><th>Carpeta</th><th>Reflexión</th><th>Pruebas</th><th *ngIf="!isCoordinator()"></th></tr></thead><tbody><tr *ngFor="let activity of activityRows(student); let index = index"><td>{{ index + 1 }}</td><td><input [(ngModel)]="activity.proyecto" [disabled]="isCoordinator()" placeholder="Nombre de la experiencia" /></td><td><input [(ngModel)]="activity.fechas[0]" [disabled]="isCoordinator()" placeholder="DD-MM" /><input [(ngModel)]="activity.fechas[1]" [disabled]="true" title="El backend registra una sola fecha por experiencia" placeholder="DD-MM" /></td><td><button type="button" class="flag-button" [class.active]="activity.creatividad" [disabled]="isCoordinator()" (click)="toggleFlag(activity, 'creatividad')">C</button></td><td><button type="button" class="flag-button" [class.active]="activity.actividad" [disabled]="isCoordinator()" (click)="toggleFlag(activity, 'actividad')">A</button></td><td><button type="button" class="flag-button" [class.active]="activity.servicio" [disabled]="isCoordinator()" (click)="toggleFlag(activity, 'servicio')">S</button></td><td *ngFor="let resultIndex of outcomeNumbers"><input class="outcome-checkbox" type="checkbox" [checked]="activity.resultados[resultIndex - 1]" [disabled]="isCoordinator()" (change)="setOutcome(activity, resultIndex - 1, $any($event.target).checked)" /></td><td><button type="button" class="doc-button" [class.active]="activity.carpeta" [disabled]="isCoordinator()" (click)="activity.carpeta = !activity.carpeta">✓</button></td><td><button type="button" class="doc-button" [class.active]="activity.reflexion" [disabled]="isCoordinator()" (click)="activity.reflexion = !activity.reflexion">✓</button></td><td><button type="button" class="doc-button" [class.active]="activity.pruebas" [disabled]="isCoordinator()" (click)="activity.pruebas = !activity.pruebas">✓</button></td><td *ngIf="!isCoordinator()"><button type="button" class="remove-button" [disabled]="student.actividades.length === 1" (click)="removeActivity(student, index)">×</button></td></tr></tbody></table></div><div class="add-row-actions"><button *ngIf="!isCoordinator()" type="button" class="secondary-button" [disabled]="student.actividades.length >= 13" (click)="addActivity(student)">Agregar fila</button></div><div class="cas-milestones"><label><input type="checkbox" [(ngModel)]="student.perfil" [disabled]="isCoordinator()" /> Perfil</label><label><input type="checkbox" [(ngModel)]="student.entrevistaI" [disabled]="isCoordinator()" /> I Entrevista</label><label><input type="checkbox" [(ngModel)]="student.entrevistaII" [disabled]="isCoordinator()" /> II Entrevista</label><label><input type="checkbox" [(ngModel)]="student.entrevistaIII" [disabled]="isCoordinator()" /> III Entrevista Final</label></div><div class="table-actions table-actions-bottom"><button *ngIf="!isCoordinator()" type="button" class="primary-button" [disabled]="guardando()" (click)="save(student)">Guardar cambios</button><button *ngIf="isCoordinator()" type="button" class="secondary-button" [disabled]="!selected()" (click)="printReport()">Generar reporte CAS</button></div>
        </section>
      </section>
      <p *ngIf="!selected() && !isCoordinator()" class="panel">{{ mensajeVacio() }}</p>
    </main>

    <div *ngIf="outcomeModal() as modal" class="modal-backdrop" (click)="closeOutcome()"><section class="help-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()"><button type="button" class="close-button" (click)="closeOutcome()">×</button><p>{{ outcomes[modal.index] }}</p></section></div>

    <div *ngIf="observacionesModal() as student" class="modal-backdrop" (click)="cerrarObservaciones()"><section class="observations-modal" role="dialog" aria-modal="true" aria-labelledby="observations-title" (click)="$event.stopPropagation()"><div class="observations-modal-heading"><div><p class="eyebrow">{{ student.estudiante }}</p><h3 id="observations-title">Observaciones</h3></div><button type="button" class="close-button" aria-label="Cerrar observaciones" (click)="cerrarObservaciones()">×</button></div><p class="observations-note">Estas observaciones se verán reflejadas en el reporte CAS de este estudiante.@if (!isCoordinator()) { <br /><span>Presione <strong>Enter</strong> para ingresar la siguiente observación.</span> }</p><label class="observations-field"><span>Observaciones del estudiante</span><textarea #observacionesInput [(ngModel)]="observacionesDraft" (input)="asegurarVinetas($event)" (keydown)="agregarVignetaObservacion($event); protegerVigneta($event)" [readonly]="isCoordinator()" rows="8" maxlength="2000" placeholder="Escriba aquí sus observaciones"></textarea><small>{{ observacionesDraft.length }}/2000 caracteres</small></label><div class="observations-actions"><button type="button" class="secondary-button" (click)="cerrarObservaciones()">Cerrar</button>@if (!isCoordinator()) { <button type="button" class="observations-button" [disabled]="guardando()" (click)="guardarObservaciones()">Guardar observaciones</button> }</div></section></div>


    <section *ngIf="selected() as student" class="print-report"><div class="print-page"><div class="print-header original-header"><img class="mep-logo" src="/cas-mep.png" alt="Ministerio de Educación Pública" /><span class="header-rule"></span><span>DRE Turrialba</span><span class="header-rule"></span><span>Supervisión Circuito 02</span><span class="header-rule"></span><strong>Instituto de Educación Dr.<br />Clodomiro Picado Twight<br /><small>Cod. 4069</small></strong><img class="school-crest" src="/cas-crest.png" alt="Escudo institucional" /><img class="ib-logo" src="/cas-ib.png" alt="International Baccalaureate" /></div><h1>INFORME DE RESULTADOS CAS {{ student.periodo }}</h1><p class="student-line"><b>Nombre del estudiante:</b> <u>{{ student.estudiante }}</u>. <b>Sección:</b> <u>{{ student.seccion }}</u>. <b>E-mail:</b> <u>{{ student.correo }}</u></p><p>Indicaciones: El check (✓) significa que el estudiante cumple con el requisito.</p><table class="cas-report-table"><colgroup><col class="report-project" /><col class="report-date" /><col class="report-cas" /><col class="report-cas" /><col class="report-cas" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-outcome" /><col class="report-document" /><col class="report-document" /><col class="report-document" /></colgroup><thead><tr><th rowspan="2">Proyectos / Serie de experiencias / Experiencias</th><th rowspan="2">Fecha</th><th rowspan="2">C</th><th rowspan="2">A</th><th rowspan="2">S</th><th colspan="7">Resultados de aprendizaje</th><th colspan="3">Documentación</th></tr><tr><th *ngFor="let number of outcomeNumbers">{{ number }}</th><th>Carpeta</th><th>Reflexión</th><th>Pruebas</th></tr></thead><tbody><tr *ngFor="let activity of reportRows(student)"><td class="project-cell">{{ activity.proyecto }}</td><td class="date-cell">{{ activity.fechas.join('\n') }}</td><td>{{ mark(activity.creatividad) }}</td><td>{{ mark(activity.actividad) }}</td><td>{{ mark(activity.servicio) }}</td><td *ngFor="let result of activity.resultados">{{ mark(result) }}</td><td>{{ mark(activity.carpeta) }}</td><td>{{ mark(activity.reflexion) }}</td><td>{{ mark(activity.pruebas) }}</td></tr></tbody></table><div class="interviews"><span>Perfil<br /><b>( {{ mark(student.perfil) }} )</b></span><span>I Entrevista<br /><b>( {{ mark(student.entrevistaI) }} )</b></span><span>II Entrevista<br /><b>( {{ mark(student.entrevistaII) }} )</b></span><span>III Entrevista Final<br /><b>( {{ mark(student.entrevistaIII || student.entrevistaFinal) }} )</b></span></div><footer>125 m norte de los Tribunales de Justicia de Turrialba. Teléfono 2556-0025<br />Correo: inst.clodomiropicadotwight@mep.go.cr</footer></div><div class="print-page"><div class="print-header original-header"><img class="mep-logo" src="/cas-mep.png" alt="Ministerio de Educación Pública" /><span class="header-rule"></span><span>DRE Turrialba</span><span class="header-rule"></span><span>Supervisión Circuito 02</span><span class="header-rule"></span><strong>Instituto de Educación Dr.<br />Clodomiro Picado Twight<br /><small>Cod. 4069</small></strong><img class="school-crest" src="/cas-crest.png" alt="Escudo institucional" /><img class="ib-logo" src="/cas-ib.png" alt="International Baccalaureate" /></div><div class="observations-box"><h2>Observaciones:</h2><p>{{ student.observaciones?.trim() || 'Sin observaciones registradas.' }}</p></div><div class="signatures"><p>Coordinador CAS: __________________________________________.</p><p>Profesor CAS: ______________________________________________.</p><p>Firma de encargado: ________________________________________.</p><p>Fecha: __________________________.</p></div><footer>125 m norte de los Tribunales de Justicia de Turrialba. Teléfono 2556-0025<br />Correo: inst.clodomiropicadotwight@mep.go.cr</footer></div></section>
  `,
  styles: `
    :host{display:block}.cas-page{display:grid;gap:1rem;align-content:start}.page-heading,.panel{padding:1rem 1.15rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.page-heading{display:flex;justify-content:space-between;gap:1rem;border-left:5px solid #1b6f60}.page-heading h2,.page-heading p:last-child,.editor-heading h3,.editor-heading p{margin:0}.page-heading p:last-child{margin-top:.3rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#1b6f60;font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.role-chip{padding:.4rem .65rem;border-radius:99px;background:#e7f5ef;color:#13775f;font-size:.74rem;font-weight:800;white-space:nowrap}.toolbar{display:flex;align-items:end;gap:.8rem}.toolbar label,.meta-grid label,.observations,.assigned-filter{display:grid;gap:.3rem;flex:1;color:#4b5563;font-size:.76rem;font-weight:700}.assigned-filter strong{padding:.48rem .55rem;border:1px solid #cfdbe5;border-radius:5px;background:#f8fafc;color:#25364a;font-weight:400}.toolbar input,.toolbar select,.meta-grid input,.meta-grid select,.observations textarea,.cas-entry-table input{width:100%;box-sizing:border-box;border:1px solid #cfdbe5;border-radius:5px;padding:.48rem .55rem;background:#fff;font:inherit;font-weight:400;color:#25364a}.primary-button,.secondary-button,.remove-button{border:0;border-radius:5px;padding:.55rem .75rem;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer;white-space:nowrap}.primary-button{background:#1b6f60;color:#fff}.secondary-button{background:#e8f1f7;color:#1e5578}.primary-button:disabled,.secondary-button:disabled,.remove-button:disabled{opacity:.45;cursor:not-allowed}.cas-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:1rem}.student-panel{display:grid;align-content:start;gap:.45rem}.section-heading,.editor-heading,.table-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:.8rem}.section-heading h3,.table-heading h3{margin:0;color:#1e3a5f;font-size:.96rem}.counter{padding:.2rem .5rem;border-radius:99px;background:#eefaf8;color:#1b6f60;font-weight:800}.student-option{display:grid;gap:.15rem;padding:.65rem .7rem;border:1px solid #e2eaf1;border-radius:6px;background:#fff;text-align:left;cursor:pointer}.student-option.selected,.student-option:hover{border-color:#1b6f60;background:#edf9f4}.student-option strong{color:#1e3a5f;font-size:.8rem}.student-option span,.student-option small{color:#667085;font-size:.7rem}.editor-heading{align-items:center}.editor-heading p{margin-top:.25rem;color:#667085;font-size:.78rem}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin:1rem 0}.milestones{display:flex;flex-wrap:wrap;gap:.75rem;padding:.65rem;background:#f8fafc;border:1px solid #e1eaf1;border-radius:6px;font-size:.75rem}.table-heading{align-items:center;margin-top:1rem;padding-top:.85rem;border-top:1px solid #e6edf3}.table-heading h3{font-size:.88rem}.table-scroll{overflow-x:auto;margin-top:.6rem}.cas-entry-table{width:100%;min-width:900px;border-collapse:collapse;font-size:.7rem}.cas-entry-table th,.cas-entry-table td{border:1px solid #d4dfe8;text-align:center;padding:.25rem}.cas-entry-table th{background:#eef3f6;color:#3c4b59;font-size:.67rem}.cas-entry-table th:first-child{width:26px}.cas-entry-table th:nth-child(2){min-width:190px}.cas-entry-table th:nth-child(3){width:90px}.cas-entry-table th.number-heading button{border:0;background:transparent;color:#1e5578;font-weight:800;cursor:help}.cas-entry-table td:nth-child(2){text-align:left}.cas-entry-table td:nth-child(2) input{min-width:180px}.cas-entry-table td:nth-child(3) input{min-width:68px}.cas-entry-table td:nth-child(3) input+input{margin-top:2px}.flag-button,.number-button,.doc-button{width:25px;height:25px;border:1px solid #c7d6df;border-radius:4px;background:#fff;color:#668092;font-size:.68rem;font-weight:800;cursor:pointer}.flag-button.active,.number-button.active,.doc-button.active{border-color:#1b6f60;background:#1b6f60;color:#fff}.number-button{border-radius:50%;font-size:.65rem}.doc-button{font-size:.8rem}.remove-button{padding:.15rem .45rem;background:#fff0f0;color:#a83232}.observations{margin-top:.85rem}.rubric-note{display:flex;align-items:center;gap:.65rem;color:#425466;font-size:.8rem}.rubric-note p{margin:.15rem 0 0;color:#667085}.help-icon{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#1b6f60;color:#fff;font-weight:800}.modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:1rem;background:rgba(20,36,52,.45)}.help-modal{width:min(100%,420px);padding:1.2rem;border-radius:9px;background:#fff;box-shadow:0 18px 50px rgba(20,36,52,.25)}.modal-heading{display:flex;justify-content:space-between;gap:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.help-modal>p{line-height:1.5;color:#425466}.close-button{border:0;background:transparent;font-size:1.4rem;color:#667085;cursor:pointer}.print-report{display:none}
    .student-heading{display:flex;align-items:center;gap:.8rem}.student-heading .observations-button{margin-left:1.2rem}.student-heading h3{margin:0}.observations-button{border:0;border-radius:5px;padding:.55rem .75rem;background:#7650a8;color:#fff;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer;white-space:nowrap}.observations-button:disabled{opacity:.5;cursor:not-allowed}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.observations-modal{width:min(100%,620px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.observations-modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.observations-modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.observations-note{margin:.8rem 0;color:#667085;font-size:.82rem;line-height:1.45}.observations-field{display:grid;gap:.35rem;color:#25364a;font-size:.78rem;font-weight:700}.observations-field textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #cfdbe5;border-radius:6px;padding:.65rem;font:inherit;font-weight:400;color:#25364a}.observations-field textarea::placeholder{color:#98a2b3;font-style:italic;opacity:1}.observations-field small{color:#667085;font-weight:400;text-align:right}.observations-actions{display:flex;justify-content:flex-end;align-items:center;gap:.55rem;margin-top:1rem}
    @media(max-width:900px){.cas-layout{grid-template-columns:1fr}.toolbar{display:grid;grid-template-columns:1fr}.meta-grid{grid-template-columns:1fr}.page-heading{display:grid}}
    @media print{body:has(.print-report){background:#fff!important}body:has(.print-report) app-root>*:not(router-outlet){display:none!important}.print-report{display:block;color:#111;font-family:Arial,sans-serif}.print-page{width:210mm;min-height:297mm;box-sizing:border-box;padding:13mm 12mm 20mm;position:relative;page-break-after:always}.print-page:last-child{page-break-after:auto}.print-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-bottom:2px solid #222;padding-bottom:6px}.print-header img{width:42px;height:42px;object-fit:contain}.print-header div{flex:1;text-align:center;font-size:12px}.print-header small{display:block;font-size:9px;font-weight:400;margin-top:3px}.print-mark{width:45px;height:40px;display:grid;place-items:center;border:1px solid #777;font-size:9px;font-weight:800}.print-page h1{text-align:center;font-size:17px;margin:14px 0}.student-line,.print-page>p{font-size:10px;line-height:1.5}.cas-report-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8px}.cas-report-table th,.cas-report-table td{border:1px solid #111;text-align:center;padding:3px 2px;height:21px}.cas-report-table th{background:#e5e5e5}.cas-report-table th:first-child,.cas-report-table td:first-child{width:31%}.cas-report-table th:nth-child(2),.cas-report-table td:nth-child(2){width:8%}.cas-report-table .project-cell{text-align:left;padding-left:5px}.interviews{display:flex;justify-content:space-around;text-align:center;font-size:10px;font-weight:700;margin:25px 0}.interviews b{font-size:12px}.print-page footer{position:absolute;bottom:7mm;left:12mm;right:12mm;padding:8px;background:#202b61;color:#fff;text-align:center;font-size:9px}.compact{justify-content:flex-start}.observations-box{height:145mm;border:1px solid #111;margin-top:20px;padding:10px;font-size:12px}.observations-box h2{margin:0 0 22px;font-size:16px}.observations-box p{white-space:pre-wrap;line-height:1.5}.signatures{font-size:12px;line-height:3.5;margin:25px 10px}}
  `,
})
export class CasVistaComponent {
  @ViewChild('observacionesInput') private observacionesInput?: ElementRef<HTMLTextAreaElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly casApi = inject(CasProfesorApiService);
  private readonly regularApi = inject(ProfesorRegularApiService);
  private readonly periodosApi = inject(CursosLectivosApiService);
  private readonly feedback = inject(FeedbackService);
  protected readonly isCoordinator = computed(() => this.route.snapshot.data['casMode'] === 'coordinator');
  // Ambas modalidades consultan informes reales; solo el Profesor CAS puede editarlos.
  private readonly periodo = signal<PeriodoActualApi | null>(null);
  private readonly secciones = signal<SeccionCasRef[]>([]);
  private readonly estudiantesApi = signal<EstudianteCas[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly selectedId = signal('');
  protected readonly outcomeNumbers = [1, 2, 3, 4, 5, 6, 7];
  protected readonly outcomes = OUTCOMES;
  protected readonly sections = computed(() => {
    return this.secciones().map((item) => item.seccion);
  });
  protected readonly assignedSection = computed(() => !this.isCoordinator() && this.sections().length === 1 ? this.sections()[0] : '');
  protected readonly selectedSection = signal('Todas');
  private readonly todosEstudiantes = computed<EstudianteCas[]>(() => this.estudiantesApi());
  protected readonly selected = computed(() => { const list = this.pickerStudents(); return list.find((student) => student.id === this.selectedId()) ?? list[0]; });
   protected readonly pickerStudents = computed(() => { const section = this.selectedSection(); return this.todosEstudiantes().filter((student) => section === 'Todas' || student.seccion === section); });
   protected readonly outcomeModal = signal<{ index: number; activity?: CasActivityView } | null>(null);
   protected readonly observacionesModal = signal<EstudianteCas | null>(null);
   protected observacionesDraft = '';
   protected readonly mensajeVacio = computed(() => this.cargando() ? 'Cargando estudiantes CAS...' : this.periodo()?.semestreActual ? 'No tienes una sección CAS asignada en el periodo actual.' : 'No hay un semestre activo para registrar informes CAS.');

  constructor() {
    this.cargarMisSecciones();
  }

  protected seleccionarEstudiante(id: string): void {
    this.selectedId.set(id);
    const student = this.todosEstudiantes().find((item) => item.id === id);
    if (student) this.cargarInforme(student);
  }

  protected cambiarSeccion(seccion: string): void {
    this.selectedSection.set(seccion);
    this.seleccionarEstudiante(this.pickerStudents()[0]?.id ?? '');
  }

   protected select(student: EstudianteCas): void { this.seleccionarEstudiante(student.id); }

   protected abrirObservaciones(student: EstudianteCas): void {
     this.observacionesModal.set(student);
     this.observacionesDraft = this.formatearObservaciones(student.observaciones ?? '');
     setTimeout(() => {
       const input = this.observacionesInput?.nativeElement;
       input?.focus();
       input?.setSelectionRange(input.value.length, input.value.length);
     });
   }

   protected cerrarObservaciones(): void {
     this.observacionesModal.set(null);
     this.observacionesDraft = '';
   }

   protected agregarVignetaObservacion(event: KeyboardEvent): void {
     if (this.isCoordinator() || event.key !== 'Enter') return;
     const textarea = event.target as HTMLTextAreaElement;
     event.preventDefault();
     const inicio = textarea.selectionStart;
     const valor = this.observacionesDraft;
     this.observacionesDraft = `${valor.slice(0, inicio)}\n• ${valor.slice(textarea.selectionEnd)}`;
     setTimeout(() => textarea.setSelectionRange(inicio + 3, inicio + 3));
   }

   protected asegurarVinetas(event: Event): void {
     if (this.isCoordinator()) return;
     const textarea = event.target as HTMLTextAreaElement;
     const valor = textarea.value;
     if (!valor) { this.observacionesDraft = ''; return; }
     const cursor = textarea.selectionStart;
     const formateado = this.formatearObservaciones(valor);
     this.observacionesDraft = formateado;
     if (formateado !== valor) {
       textarea.value = formateado;
       const desplazamiento = formateado.length - valor.length;
       setTimeout(() => textarea.setSelectionRange(cursor + Math.max(0, desplazamiento), cursor + Math.max(0, desplazamiento)));
     }
   }

   protected protegerVigneta(event: KeyboardEvent): void {
     if (this.isCoordinator() || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
     const textarea = event.target as HTMLTextAreaElement;
     const inicio = textarea.selectionStart;
     const fin = textarea.selectionEnd;
     const seleccionaVigneta = textarea.value.slice(inicio, fin).includes('•');
     const borraVigneta = event.key === 'Backspace'
       ? inicio > 0 && textarea.value[inicio - 1] === '•'
       : textarea.value[inicio] === '•';
     if (seleccionaVigneta || borraVigneta) event.preventDefault();
   }

   protected guardarObservaciones(): void {
     const student = this.observacionesModal();
     if (!student || this.isCoordinator()) return;
     const observaciones = this.formatearObservaciones(this.observacionesDraft);
     if (observaciones.length > 2000) { this.feedback.error('Las observaciones no pueden superar los 2000 caracteres.'); return; }
     student.observaciones = observaciones;
     this.save(student, 'Las observaciones del estudiante fueron guardadas.');
   }

   private formatearObservaciones(value: string): string {
     return value.split(/\r?\n/).map((line) => line.replace(/^\s*•\s*/, '').trim()).filter(Boolean).map((line) => `• ${line}`).join('\n');
   }

   protected save(student: EstudianteCas, successMessage = 'El informe CAS fue guardado.'): void {
    if (this.isCoordinator()) return;
    const anio = student.anio;
    const semestre = this.periodo()?.semestreActual;
    if (anio === undefined || !semestre) { this.feedback.error('No hay un semestre activo para guardar el informe CAS.'); return; }
    const experiencias: GuardarInformeCasRequest['experiencias'] = [];
    for (const actividad of student.actividades) {
      const descripcion = actividad.proyecto.trim();
      const marcada = actividad.creatividad || actividad.actividad || actividad.servicio || actividad.carpeta || actividad.reflexion || actividad.pruebas || actividad.resultados.some(Boolean) || Boolean(actividad.fechas[0]?.trim());
      if (!descripcion && !marcada) continue;
      if (descripcion.length < 3 || descripcion.length > 255) { this.feedback.error('Cada experiencia necesita un nombre de 3 a 255 caracteres.'); return; }
      const fecha = this.fechaParaApi(actividad.fechas[0] ?? '', anio);
      if (fecha === undefined) { this.feedback.error('La fecha de la experiencia debe escribirse como DD-MM.'); return; }
      experiencias.push({
        descripcion,
        fecha,
        creatividad: actividad.creatividad,
        actividad: actividad.actividad,
        servicio: actividad.servicio,
        resultadosAprendizaje: actividad.resultados.map((value, index) => value ? index + 1 : 0).filter((value) => value > 0),
        carpeta: actividad.carpeta,
        reflexion: actividad.reflexion,
        pruebas: actividad.pruebas,
      });
    }
    if (experiencias.length > 30) { this.feedback.error('El informe admite como máximo 30 experiencias.'); return; }
    const request: GuardarInformeCasRequest = {
      perfil: student.perfil,
      entrevista1: student.entrevistaI,
      entrevista2: student.entrevistaII,
      entrevistaFinal: student.entrevistaIII || student.entrevistaFinal,
      observaciones: student.observaciones?.trim() || null,
      experiencias,
    };
    this.guardando.set(true);
    this.casApi.guardar(anio, semestre, student.id, request).pipe(
      switchMap(() => this.casApi.obtener(anio, semestre, student.id)),
      finalize(() => this.guardando.set(false)),
    ).subscribe({
       next: (informe) => { this.aplicarInforme(student, informe); this.cerrarObservaciones(); this.feedback.exito(successMessage); },
      error: (error) => this.feedback.error(error?.error?.mensaje ?? 'No se pudo guardar el informe CAS.'),
    });
  }

  private cargarMisSecciones(): void {
    this.cargando.set(true);
    this.periodosApi.obtenerActual().pipe(
      switchMap((periodo) => {
        this.periodo.set(periodo);
        if (this.isCoordinator()) return this.cargarCoordinacion(periodo);
        return this.regularApi.listarAsignaciones(periodo.anio).pipe(
          map((asignaciones) => asignaciones.filter((item) => item.codigoAsignatura === 'CAS')),
          switchMap((cas) => {
            const semestre = periodo.semestreActual;
            if (!semestre || !cas.length) return of({ refs: [], estudiantes: [] });
            const refs = [...new Map(cas.map((item) => [`${item.anio}-${item.nivel}-${item.numero}`, { anio: item.anio, nivel: item.nivel, numero: item.numero, seccion: item.seccion }])).values()];
            return forkJoin(refs.map((ref) => this.casApi.progreso(ref.anio, ref.nivel, ref.numero, semestre).pipe(
              map((rows) => rows.map((row) => this.estudianteDesdeProgreso(row, ref, periodo))),
            ))).pipe(map((grupos) => ({ refs, estudiantes: grupos.flat() })));
          }),
        );
      }),
      finalize(() => this.cargando.set(false)),
    ).subscribe({
      next: ({ refs, estudiantes }) => {
        this.secciones.set(refs);
        this.estudiantesApi.set(estudiantes);
        this.selectedSection.set(this.assignedSection() || 'Todas');
        this.seleccionarEstudiante(this.pickerStudents()[0]?.id ?? '');
      },
      error: () => this.feedback.error('No se pudieron cargar los estudiantes CAS.'),
    });
  }

  private cargarCoordinacion(periodo: PeriodoActualApi): Observable<CargaCas> {
    const semestre = periodo.semestreActual;
    if (!semestre) return of({ refs: [], estudiantes: [] });
    return this.casApi.progresoGeneral({ anio: periodo.anio, semestre }).pipe(
      map((rows) => {
        const refs = [...new Map(rows.map((row) => [`${row.anio}-${row.seccion}`, { anio: row.anio, nivel: 0, numero: 0, seccion: row.seccion }])).values()];
        return { refs, estudiantes: rows.map((row) => this.estudianteDesdeProgreso(row, { anio: row.anio, nivel: 0, numero: 0, seccion: row.seccion }, periodo)) };
      }),
    );
  }

  private estudianteDesdeProgreso(row: ProgresoCasApi, ref: SeccionCasRef, periodo: PeriodoActualApi): EstudianteCas {
    return {
      id: row.cedulaEstudiante,
      estudiante: row.nombreEstudiante,
      seccion: ref.seccion,
      correo: '',
      profesorCas: row.nombreProfesor,
      periodo: this.etiquetaPeriodo(periodo),
      actividades: [],
      perfil: row.perfil,
      entrevistaI: false,
      entrevistaII: false,
      entrevistaIII: false,
      entrevistaFinal: false,
      observaciones: '',
      tieneInforme: row.tieneInforme,
      cargado: false,
      anio: ref.anio,
      semestre: row.semestre,
    };
  }

  private cargarInforme(student: EstudianteCas): void {
    const semestre = this.periodo()?.semestreActual;
    if (student.cargado || student.anio === undefined || !semestre) return;
    if (!student.tieneInforme) { student.cargado = true; return; }
    const informe$ = this.isCoordinator()
      ? this.casApi.informesEstudiante(student.anio, semestre, student.id).pipe(map((informes) => informes[0]))
      : this.casApi.obtener(student.anio, semestre, student.id);
    informe$.subscribe({
      next: (informe) => { if (informe) this.aplicarInforme(student, informe); else student.cargado = true; },
      error: (error) => this.feedback.error(error?.error?.mensaje ?? 'No se pudo cargar el informe CAS del estudiante.'),
    });
  }

  private aplicarInforme(student: EstudianteCas, informe: InformeCasApi): void {
    student.correo = informe.emailEstudiante;
    student.perfil = informe.perfil;
    student.entrevistaI = informe.entrevista1;
    student.entrevistaII = informe.entrevista2;
    student.entrevistaIII = informe.entrevistaFinal;
    student.entrevistaFinal = informe.entrevistaFinal;
    student.observaciones = informe.observaciones ?? '';
    student.actividades = informe.experiencias.map((item) => this.actividadDesdeApi(item, informe.anio));
    student.tieneInforme = true;
    student.cargado = true;
    this.estudiantesApi.update((list) => [...list]);
  }

  private actividadDesdeApi(item: ExperienciaCasApi, anio: number): CasActivityView {
    return {
      id: `${anio}-${item.orden}`,
      proyecto: item.descripcion,
      fechas: [this.fechaParaMostrar(item.fecha), ''],
      creatividad: item.creatividad,
      actividad: item.actividad,
      servicio: item.servicio,
      resultados: Array.from({ length: 7 }, (_, index) => item.resultadosAprendizaje.includes(index + 1)),
      carpeta: item.carpeta,
      reflexion: item.reflexion,
      pruebas: item.pruebas,
    };
  }

  // DD-MM (o AAAA-MM-DD) del formulario → fecha ISO del periodo. undefined = formato inválido.
  private fechaParaApi(valor: string, anio: number): string | null | undefined {
    const texto = valor.trim();
    if (!texto) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
    const match = /^(\d{1,2})-(\d{1,2})$/.exec(texto);
    if (!match) return undefined;
    const dia = Number(match[1]);
    const mes = Number(match[2]);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return undefined;
    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  private fechaParaMostrar(iso: string | null): string {
    if (!iso) return '';
    const [, mes, dia] = iso.split('-');
    return `${dia}-${mes}`;
  }

  private etiquetaPeriodo(periodo: PeriodoActualApi): string {
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }
  protected addActivity(student: EstudianteCas): void { student.actividades.push(this.newActivity(`${student.id}-${Date.now()}`)); }
  protected removeActivity(student: EstudianteCas, index: number): void { if (student.actividades.length > 1) student.actividades.splice(index, 1); }
  protected activityRows(student: EstudianteCas): CasActivityView[] { while (student.actividades.length < 4) student.actividades.push(this.newActivity(`${student.id}-row-${student.actividades.length + 1}`)); return student.actividades.slice(0, 13); }
  protected toggleFlag(activity: CasActivityView, flag: 'creatividad' | 'actividad' | 'servicio'): void { activity[flag] = !activity[flag]; }
  protected setOutcome(activity: CasActivityView, index: number, checked: boolean): void { activity.resultados[index] = checked; }
  protected openOutcome(index: number): void { this.outcomeModal.set({ index }); }
  protected closeOutcome(): void { this.outcomeModal.set(null); }
  protected toggleOutcome(activity: CasActivityView, index: number): void { activity.resultados[index] = !activity.resultados[index]; this.closeOutcome(); }
  protected mark(value: boolean): string { return value ? '✓' : ''; }
  protected reportRows(student: EstudianteCas): CasActivityView[] { return [...student.actividades, ...Array.from({ length: Math.max(0, 13 - student.actividades.length) }, (_, index) => this.newActivity(`empty-${index}`))].slice(0, 13); }
  protected printReport(): void { if (this.selected()) setTimeout(() => window.print()); }
  private newActivity(id: string): CasActivityView { return { id, proyecto: '', fechas: ['', ''], creatividad: false, actividad: false, servicio: false, resultados: Array.from({ length: 7 }, () => false), carpeta: false, reflexion: false, pruebas: false }; }
}
