import { Component } from '@angular/core';

@Component({
  selector: 'app-vista-monografias',
  imports: [],
  template: `
    <section class="monograph-workspace" aria-labelledby="monographs-title">
      <header class="monograph-hero">
        <div><p class="eyebrow">Acompañamiento de investigación</p><h2 id="monographs-title">Mis estudiantes de monografía</h2><p>Revise el avance y registre los reportes de cada estudiante asignado.</p></div>
         <button type="button" class="primary-button" disabled>Registrar reporte</button>
      </header>

       <div class="summary-strip" aria-label="Resumen de monografías"><div><strong>{{ monographs.length }}</strong><span>Estudiantes asignados</span></div><div><strong>2</strong><span>En desarrollo</span></div><div><strong>1</strong><span>Reporte disponible</span></div></div>

      <section class="monograph-list">
         <div class="list-toolbar"><div><h3>Proyectos asignados</h3><p>Datos de ejemplo para la exposición.</p></div></div>
        <div class="project-grid">
            @for (item of monographs; track item.id) {
            <article class="project-card">
              <div class="project-card__top"><span class="student-mark">{{ initials(item.student) }}</span><span class="badge">{{ item.status }}</span></div>
              <div><p class="project-card__student">{{ item.student }}</p><h4>{{ item.title }}</h4><p class="project-card__area">{{ item.area }}</p></div>
              <dl><div><dt>Último reporte</dt><dd>{{ latestDate(item) }}</dd></div><div><dt>Inicio</dt><dd>{{ item.startDate }}</dd></div></dl>
                <div class="project-actions"><button type="button" class="ghost-button">Ver monografía</button><button type="button" class="primary-button">Nuevo reporte</button></div>
            </article>
          } @empty {
             <p class="empty-state">No hay datos de ejemplo.</p>
          }
        </div>
      </section>
    </section>
  `,
  styles: `
    .monograph-workspace{display:grid;gap:1rem}.monograph-hero,.monograph-list,.summary-strip{background:#fff;border:1px solid #dbe5ef;border-radius:12px;padding:1.25rem}.monograph-hero{display:flex;justify-content:space-between;align-items:center;gap:1rem;background:linear-gradient(120deg,#17334f,#285f89);color:#fff;padding:clamp(1.4rem,4vw,2.4rem)}h2,h3,h4,p{margin:0}.monograph-hero p{color:#d8e7f1;margin-top:.4rem}.eyebrow{color:#9dc6df!important;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:800}.summary-strip{display:grid;grid-template-columns:repeat(3,1fr);padding:0}.summary-strip div{display:grid;gap:.2rem;padding:1rem 1.25rem;border-right:1px solid #e3eaf0}.summary-strip div:last-child{border:0}.summary-strip strong{font-size:1.45rem;color:#1e3a5f}.summary-strip span{font-size:.86rem;color:#667085}.list-toolbar{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1rem}.list-toolbar p{color:#667085;margin-top:.3rem}.list-toolbar input{min-width:280px}.project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:1rem}.project-card{display:grid;gap:1rem;padding:1.15rem;border:1px solid #dbe5ef;border-radius:11px;background:#fbfdff}.project-card__top,.project-actions,dl,dl div{display:flex;align-items:center;justify-content:space-between;gap:.7rem}.student-mark{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.project-card__student{color:#2f6b9a;font-weight:700}.project-card h4{margin-top:.25rem;color:#1e3a5f;font-size:1.05rem}.project-card__area{color:#667085;margin-top:.3rem}dl{margin:0}dt{font-size:.74rem;color:#667085}dd{margin:.2rem 0 0;font-weight:700;font-size:.86rem}.project-actions>*{flex:1}.empty-state{grid-column:1/-1;padding:2rem;text-align:center;color:#667085}@media(max-width:680px){.monograph-hero,.list-toolbar{align-items:stretch;flex-direction:column}.summary-strip{grid-template-columns:1fr}.summary-strip div{border-right:0;border-bottom:1px solid #e3eaf0}.list-toolbar input{min-width:0}.project-actions{flex-direction:column}.project-actions>*{width:100%}}
  `,
})
export class MonografiasVista {
   protected readonly monographs = [
     { id: 'M-301', student: 'José Luis Rodríguez Mora', title: 'Lectura crítica y escritura argumentativa', area: 'Lengua A', supervisor: 'Ana Lucía Solano Castro', status: 'En desarrollo', startDate: '2026-08-05', followUps: [{ date: '2026-08-22' }] },
     { id: 'M-204', student: 'María Fernanda Jiménez Vargas', title: 'Modelos de reciclaje escolar', area: 'Estudios Sociales', supervisor: 'Juan Gabriel Valverde Valverde', status: 'Aprobada', startDate: '2026-07-18', followUps: [{ date: '2026-08-01' }] },
     { id: 'M-101', student: 'Carlos Eduardo Araya Rojas', title: 'Impacto social de la lectura digital', area: 'Teoría del Conocimiento', supervisor: 'Laura Vanessa Quirós Brenes', status: 'En desarrollo', startDate: '2026-08-08', followUps: [{ date: '2026-08-22' }] },
   ];
  protected initials(name: string) { return name.split(' ').slice(0, 2).map((part) => part[0]).join(''); }
  protected latestDate(item: { followUps: Array<{ date: string }> }) { return item.followUps.at(-1)?.date ?? 'Sin reportes'; }
}
