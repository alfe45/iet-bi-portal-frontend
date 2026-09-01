import { Component } from '@angular/core';

@Component({
  selector: 'app-vista-ausentismo',
  imports: [],
  template: `
    <section class="attendance-workspace" aria-labelledby="attendance-title">
       <header class="workspace-header"><div><p class="eyebrow">Registro académico</p><h2 id="attendance-title">Ausentismo</h2><p>Vista previa del ausentismo registrado.</p></div><button type="button" class="ghost-button" disabled>← Volver</button></header>
      <div class="context-bar"><div><small>Periodo activo</small><strong>2026 · Segundo semestre</strong></div><div><small>Sección</small><strong>11-1 · Historia</strong></div></div>
       <section class="attendance-list"><div class="list-heading"><div><h3>Estudiantes de 11-1</h3><p>Historia · Vista previa de asistencia.</p></div><span>{{ students.length }} estudiantes</span></div>
        @for (student of students; track student.id) {
           <button type="button" class="attendance-row" disabled><span class="student-avatar">{{ student.initials }}</span><span class="student-name"><strong>{{ student.name }}</strong><small>{{ student.id }}</small></span><span><small>Tardías</small><strong>{{ student.late }}</strong></span><span><small>Justificadas</small><strong>{{ student.justified }}</strong></span><span><small>Injustificadas</small><strong>{{ student.unjustified }}</strong></span><span aria-hidden="true">→</span></button>
        }
      </section>
       <form class="attendance-editor" aria-labelledby="attendance-editor-title"><div><p class="eyebrow">Vista previa</p><h3 id="attendance-editor-title">José Luis Rodríguez Mora</h3></div><div class="counter-grid"><label><span>Tardías</span><input type="number" min="0" value="0" readonly /></label><label><span>Ausencias justificadas</span><input type="number" min="0" value="0" readonly /></label><label><span>Ausencias injustificadas</span><input type="number" min="0" value="0" readonly /></label></div><div class="editor-actions"><button type="button" class="ghost-button" disabled>Cancelar</button><button type="button" class="primary-button" disabled>Vista previa</button></div></form>
    </section>
  `,
  styles: `
    .attendance-workspace{display:grid;gap:1rem}.workspace-header,.context-bar,.attendance-list,.attendance-editor{background:#fff;border:1px solid #dbe5ef;border-radius:12px;padding:1.25rem}.workspace-header,.context-bar,.list-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}h2,h3,p{margin:0}.workspace-header p,.list-heading p{color:#667085;margin-top:.3rem}.eyebrow{color:#2f6b9a!important;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:800}.context-bar{background:#f2f7fa}.context-bar>div{display:grid}.context-bar app-filter-select{min-width:220px}.attendance-list{display:grid;gap:.7rem}.list-heading{margin-bottom:.35rem}.list-heading>span{padding:.4rem .7rem;border-radius:999px;background:#eaf3f8;color:#1e3a5f;font-weight:700}.attendance-row{width:100%;display:grid;grid-template-columns:auto minmax(180px,1fr) repeat(3,minmax(85px,auto)) auto;align-items:center;gap:1rem;padding:.85rem;background:#fff;border:1px solid #e0e7ee;border-radius:10px;color:#374151;text-align:left;cursor:pointer}.attendance-row:hover,.attendance-row--active{border-color:#2f6b9a;background:#f4f9fc}.attendance-row small,.attendance-row strong{display:block}.attendance-row small{color:#667085}.student-avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.counter-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem}label{display:grid;gap:.45rem;font-weight:700}.editor-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem}.success-message{margin-top:1rem;padding:.8rem;color:#245d29;background:#eef7f0;border-radius:8px}@media(max-width:820px){.context-bar{align-items:stretch;flex-direction:column}.attendance-row{grid-template-columns:auto 1fr auto}.attendance-row>span:nth-child(3),.attendance-row>span:nth-child(4),.attendance-row>span:nth-child(5){display:none}.counter-grid{grid-template-columns:1fr}}
  `,
})
export class AusentismoVistaComponent {
  protected readonly students = [{ name: 'José Luis Rodríguez Mora', id: '8-734-401', initials: 'JR', late: 1, justified: 0, unjustified: 0 }, { name: 'María Fernanda Jiménez Vargas', id: '8-811-109', initials: 'MJ', late: 2, justified: 1, unjustified: 0 }, { name: 'Carlos Eduardo Araya Rojas', id: '8-744-002', initials: 'CA', late: 0, justified: 0, unjustified: 1 }];
}
