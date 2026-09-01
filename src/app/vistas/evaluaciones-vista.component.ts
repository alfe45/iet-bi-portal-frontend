import { Component } from '@angular/core';

@Component({
  selector: 'app-vista-evaluaciones',
  imports: [],
  template: `
    <section class="academic-workspace" aria-labelledby="evaluations-title">
      <header class="workspace-header">
        <div><p class="eyebrow">Registro académico</p><h2 id="evaluations-title">Evaluaciones</h2><p>Seleccione el grupo y luego el estudiante que desea evaluar.</p></div>
        <button type="button" class="ghost-button" disabled>← Volver</button>
      </header>
      <div class="active-period" aria-label="Periodo académico activo"><span class="active-period__dot" aria-hidden="true"></span><div><small>Periodo activo</small><strong>2026 · Segundo semestre</strong></div><span>Se aplica automáticamente</span></div>
      <section class="selection-panel" aria-labelledby="group-title">
        <div class="step-heading"><span>1</span><div><h3 id="group-title">Seleccione su grupo</h3><p>Solo aparecen sus asignaciones académicas.</p></div></div>
        <div class="visual-selection"><strong>Sección:</strong> 11-1 <strong>Asignatura:</strong> Historia</div>
      </section>
      <section class="student-panel" aria-labelledby="student-title">
        <div class="step-heading"><span>2</span><div><h3 id="student-title">Estudiantes del grupo</h3><p>11-1 · Historia</p></div></div>
        <div class="student-grid">
          @for (student of students; track student.id) {
            <button type="button" class="student-card" disabled>
              <span class="student-avatar">{{ student.initials }}</span><span><strong>{{ student.name }}</strong><small>{{ student.id }}</small></span><span class="student-status">{{ student.grade }}</span>
            </button>
          }
        </div>
      </section>
        <form class="evaluation-editor" aria-labelledby="editor-title">
          <div class="step-heading"><span>3</span><div><h3 id="editor-title">Vista previa de evaluación</h3><p>José Luis Rodríguez Mora · Historia</p></div></div>
          <div class="editor-grid"><label><span>Valor mínimo</span><input value="4" readonly aria-describedby="scale-help" /></label><label><span>Valor obtenido</span><input placeholder="Ingrese la calificación" readonly /></label><label class="editor-grid__full"><span>Observación académica</span><textarea rows="4" placeholder="Describa brevemente el desempeño del estudiante" readonly></textarea></label></div>
          <small id="scale-help">Escala asignada: 1 a 7</small>
          <div class="editor-actions"><button type="button" class="ghost-button" disabled>Cancelar</button><button class="primary-button" type="button" disabled>Vista previa</button></div>
        </form>
    </section>
  `,
  styles: `
    .academic-workspace { display: grid; gap: 1rem; }.workspace-header,.selection-panel,.student-panel,.evaluation-editor,.active-period { background:#fff;border:1px solid #dbe5ef;border-radius:12px;padding:1.25rem }.workspace-header{display:flex;justify-content:space-between;align-items:center;gap:1rem}h2,h3,p{margin:0}.workspace-header p,.step-heading p{color:#667085;margin-top:.35rem}.eyebrow{color:#2f6b9a!important;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:800}.active-period{display:flex;align-items:center;gap:.75rem;background:#eef7f0;border-color:#c8e2cd}.active-period__dot{width:10px;height:10px;border-radius:50%;background:#2e7d32}.active-period div{display:grid}.active-period>span:last-child{margin-left:auto;color:#47624c;font-size:.86rem}.step-heading{display:flex;align-items:flex-start;gap:.8rem;margin-bottom:1rem}.step-heading>span{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.student-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.75rem}.student-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.75rem;min-height:76px;padding:.8rem;border:1px solid #dbe5ef;border-radius:10px;background:#fff;text-align:left;cursor:pointer;color:#374151}.student-card:hover,.student-card--selected{border-color:#2f6b9a;background:#eaf3f8}.student-avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.student-card strong,.student-card small{display:block}.student-card small{color:#667085;margin-top:.2rem}.student-status{font-weight:800;color:#2f6b9a}.editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}label{display:grid;gap:.45rem;font-weight:700}.editor-grid__full{grid-column:1/-1}.editor-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem}.success-message{margin-top:1rem;padding:.8rem;color:#245d29;background:#eef7f0;border-radius:8px}@media(max-width:680px){.workspace-header{align-items:flex-start;flex-direction:column}.editor-grid{grid-template-columns:1fr}.active-period>span:last-child{display:none}}
  `,
})
export class EvaluacionesVistaComponent {
   protected readonly section = '11-1'; protected readonly subject = 'historia';
  protected readonly students = [{ name: 'José Luis Rodríguez Mora', id: '8-734-401', initials: 'JR', grade: '6' }, { name: 'María Fernanda Jiménez Vargas', id: '8-811-109', initials: 'MJ', grade: '4' }, { name: 'Carlos Eduardo Araya Rojas', id: '8-744-002', initials: 'CA', grade: '7' }];
}
