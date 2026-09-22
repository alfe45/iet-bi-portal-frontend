import { computed, Injectable, inject, signal } from '@angular/core';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { PortalDatosService, RegistroPortal } from './portal-datos.service';

export interface GrupoTrabajo {
  id: string;
  asignatura: string;
  seccion: string;
  periodo: string;
  escala: string;
  estudiantes: RegistroPortal[];
}

@Injectable({ providedIn: 'root' })
// Construye los grupos de trabajo disponibles para el profesor autenticado.
export class GruposProfesorService {
  private readonly auth = inject(AutenticacionService);
  private readonly datos = inject(PortalDatosService);
  private readonly selectedKey = signal(this.loadKey());

  readonly periodoActivo = computed(() => this.datos.listar('periodos').find((periodo) => periodo['estado'] === 'Activo')?.['nombre'] ?? 'Sin periodo activo');
  readonly profesor = computed(() => {
    const username = this.auth.currentUsername();
    const known = this.datos.listar('profesores').find((item) => item['nombre'] === username)?.['nombre'];
    if (known) return known;
    const assigned = this.datos.asignacionesResponsabilidad().find((item) => item.cedula === username)?.profesor;
    if (assigned) return assigned;
    return this.datos.listar('asignaciones').find((item) => item['periodo'] === this.periodoActivo())?.['profesor'] ?? username;
  });
  readonly grupos = computed<GrupoTrabajo[]>(() => this.datos.listar('asignaciones')
    .filter((item) => item['profesor'] === this.profesor() && item['periodo'] === this.periodoActivo() && item['estado'] === 'Activa')
    .map((item) => {
      const asignatura = this.datos.listar('asignaturas').find((subject) => subject['nombre'] === item['asignatura']);
      return {
        id: `${item['asignatura']}|${item['seccion']}|${item['periodo']}`,
        asignatura: item['asignatura'],
        seccion: item['seccion'],
        periodo: item['periodo'],
        escala: this.escala(asignatura?.['escala']),
        estudiantes: this.datos.estudiantes().filter((student) => student['seccion'] === item['seccion']),
      };
    }));
  readonly grupoActual = computed(() => this.grupos().find((grupo) => grupo.id === this.selectedKey()) ?? this.grupos()[0]);

  seleccionar(grupo: GrupoTrabajo | string | undefined): void {
    const key = typeof grupo === 'string' ? grupo : grupo?.id;
    if (!key) return;
    this.selectedKey.set(key);
    try { sessionStorage.setItem('iet-bi-portal:grupo-activo:v1', key); } catch { }
  }

  seleccionarParametros(asignatura: string | null, seccion: string | null, periodo: string | null): void {
    const grupo = this.grupos().find((item) => item.asignatura === asignatura && item.seccion === seccion && item.periodo === periodo);
    if (grupo) this.seleccionar(grupo);
  }

  etiqueta(grupo: GrupoTrabajo | undefined): string { return grupo ? `${grupo.asignatura} · ${grupo.seccion}` : 'Sin grupo seleccionado'; }

  private escala(value: string | undefined): string {
    return value === '1-100' ? '1–100' : value === 'A-E' ? 'A–E' : '1–7';
  }

  private loadKey(): string {
    try { return sessionStorage.getItem('iet-bi-portal:grupo-activo:v1') ?? ''; } catch { return ''; }
  }
}
