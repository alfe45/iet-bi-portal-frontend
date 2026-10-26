import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { BandaAsignaturaGuiaApi, MonografiaGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, ReporteBandasGuiaApi, ReporteMonografiaGuiaApi, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';
import { ReportesBandasVistaComponent } from './reportes-bandas-vista.component';
import { VerificacionMonografiasVistaComponent } from './verificacion-monografias-vista.component';

const periodo: PeriodoGuiaApi = { anio: 2026, semestreActual: 'II_SEMESTRE' };
const seccion: SeccionGuiaApi = { anio: 2026, nivel: 11, numero: 1, nombre: '11-1', cedulaGuia: '1-1111-1111', nombreGuia: 'Profesor Guía', cantidadEstudiantes: 4 };

function asignatura(nombre: string, nota: string | null, confirmada = false): BandaAsignaturaGuiaApi {
  return { codigoAsignatura: nombre.slice(0, 3).toUpperCase(), asignatura: nombre, tipoAsignatura: 'SUPERIOR', nombreProfesor: 'Profesor', notaMinima: '4', nota, aprobada: null, tardias: 0, injustificadas: 0, justificadas: 0, observaciones: null, confirmada };
}

function banda(nombre: string, asignaturas: BandaAsignaturaGuiaApi[], monografia: ReporteBandasGuiaApi['monografia'] = null): ReporteBandasGuiaApi {
  return { anio: 2026, semestre: 'II_SEMESTRE', nivel: 11, seccion: '11-1', cedulaEstudiante: nombre, nombreEstudiante: nombre, nombreGuia: 'Profesor Guía', asignaturas, monografia };
}

function monografia(cedula: string, nombre: string, area = 'Historia'): MonografiaGuiaApi {
  return { cedulaEstudiante: cedula, nombreEstudiante: nombre, anioInicio: 2026, anioActual: 2026, seccionActual: '11-1', cedulaCoordinador: '1-2222-2222', nombreCoordinador: 'Coordinador', codigoAsignatura: area.slice(0, 3).toUpperCase(), asignatura: area, estado: 'INVESTIGACION', seguimientos: 1, ultimoSeguimiento: '2026-10-01' };
}

function seguimiento(monografiaData: MonografiaGuiaApi) {
  return { monografia: monografiaData, seguimientos: [] };
}

function configurarDependencias(api: Partial<ProfesorGuiaApiService>) {
  const feedback = { error: vi.fn(), exito: vi.fn(), confirmar: vi.fn().mockResolvedValue(false) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ProfesorGuiaApiService, useValue: api },
      { provide: AutenticacionService, useValue: { currentDisplayName: () => 'Profesor Guía' } },
      { provide: FeedbackService, useValue: feedback },
    ],
  });
  return feedback;
}

describe('verificaciones de reportes de bandas y monografías', () => {
  it('agrupa los pendientes de notas y separa los reportes de monografía completos', () => {
    const reportes = [
      banda('sin asignaturas', []),
      banda('notas pendientes', [asignatura('Historia', null), asignatura('Biología', '3', true)]),
      banda('notas sin confirmar', [asignatura('Historia', '4', false)]),
      banda('todo completo', [asignatura('Historia', '5', true)], { codigoAsignatura: 'HIS', area: 'Historia', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Informe completo', enviadoEn: '2026-10-20T10:00:00Z' }),
      banda('monografía pendiente', [asignatura('Historia', '5', true)], { codigoAsignatura: 'HIS', area: 'Historia', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Informe completo', enviadoEn: null }),
    ];
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarReportesBandas: () => of(reportes),
    } as unknown as ProfesorGuiaApiService;
    configurarDependencias(api);

    const fixture = TestBed.createComponent(ReportesBandasVistaComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const grupos = component.problemasSeccion() as Array<{ titulo: string; estudiantes: Array<{ nombre: string }> }>;

    expect(grupos.map((group) => group.titulo)).toEqual(['Notas sin registrar', 'Notas pendientes de confirmación', 'Reportes de monografía completos']);
    expect(grupos[0].estudiantes.map((student) => student.nombre)).toEqual(['sin asignaturas', 'notas pendientes']);
    expect(grupos[1].estudiantes.map((student) => student.nombre)).toEqual(['notas sin confirmar']);
    expect(grupos[2].estudiantes.map((student) => student.nombre)).toEqual(['todo completo', 'monografía pendiente']);
    expect(component.estudianteCompleto(reportes[3])).toBe(true);
    expect(component.reporteConfirmado(reportes[3])).toBe(true);
    expect(component.reporteConfirmado(reportes[4])).toBe(true);
    expect(component.estadoReporte(reportes[0])).toBe('incompleto');
    expect(component.estadoReporte(reportes[2])).toBe('completo');
    expect(component.estadoReporte(reportes[3])).toBe('confirmado');
  });

  it('no muestra grupos cuando no hay pendientes ni reportes de monografía completos', () => {
    const reportes = [banda('confirmado', [asignatura('Historia', '5', true)])];
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarReportesBandas: () => of(reportes),
    } as unknown as ProfesorGuiaApiService;
    configurarDependencias(api);

    const fixture = TestBed.createComponent(ReportesBandasVistaComponent);
    fixture.detectChanges();

    expect((fixture.componentInstance as any).problemasSeccion()).toEqual([]);
    expect((fixture.componentInstance as any).incompleteStudents()).toEqual([]);
    expect((fixture.componentInstance as any).pendingConfirmationStudents()).toEqual([]);
  });

  it('agrupa monografías incompletas y pendientes de confirmación sin mostrar las confirmadas', () => {
    const monografias = [monografia('1', 'Sin reporte', 'Historia'), monografia('2', 'Pendiente', 'Biología'), monografia('3', 'Confirmada', 'Matemática')];
    const reportes: ReporteMonografiaGuiaApi[] = [
      { cedulaEstudiante: '2', nombreEstudiante: 'Pendiente', codigoAsignatura: 'BIO', asignatura: 'Biología', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Informe listo', enviadoEn: null },
      { cedulaEstudiante: '3', nombreEstudiante: 'Confirmada', codigoAsignatura: 'MAT', asignatura: 'Matemática', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Informe listo', enviadoEn: '2026-10-20T10:00:00Z' },
    ];
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarMonografias: () => of(monografias.map(seguimiento)),
      listarReportesMonografia: () => of(reportes),
    } as unknown as ProfesorGuiaApiService;
    configurarDependencias(api);

    const fixture = TestBed.createComponent(VerificacionMonografiasVistaComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const grupos = component.problemasMonografia() as Array<{ titulo: string; estudiantes: Array<{ nombre: string }> }>;

    expect(grupos.map((group) => group.titulo)).toEqual(['Reportes de monografía incompletos', 'Reportes de monografía pendientes de confirmación']);
    expect(grupos[0].estudiantes.map((student) => student.nombre)).toEqual(['Sin reporte']);
    expect(grupos[1].estudiantes.map((student) => student.nombre)).toEqual(['Pendiente']);
    expect(component.incompleteProjects()).toHaveLength(1);
    expect(component.confirmed()).toBe(1);
    expect(component.pending()).toBe(2);
  });

  it('mantiene vacíos los grupos de monografía cuando todos están confirmados', () => {
    const data = monografia('1', 'Confirmada');
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarMonografias: () => of([seguimiento(data)]),
      listarReportesMonografia: () => of([{ cedulaEstudiante: '1', nombreEstudiante: 'Confirmada', codigoAsignatura: 'HIS', asignatura: 'Historia', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Completo', enviadoEn: '2026-10-20T10:00:00Z' }]),
    } as unknown as ProfesorGuiaApiService;
    configurarDependencias(api);

    const fixture = TestBed.createComponent(VerificacionMonografiasVistaComponent);
    fixture.detectChanges();

    expect((fixture.componentInstance as any).problemasMonografia()).toEqual([]);
    expect((fixture.componentInstance as any).incompleteProjects()).toEqual([]);
    expect((fixture.componentInstance as any).pending()).toBe(0);
  });

  it('solo permite reactivar bandas cuando hay confirmaciones y envía la sección correcta', async () => {
    const reportes = [banda('confirmado', [asignatura('Historia', '5', true)])];
    const reactivarBandasSeccion = vi.fn(() => of(undefined));
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarReportesBandas: vi.fn(() => of(reportes)),
      reactivarBandasSeccion,
    } as unknown as ProfesorGuiaApiService;
    const feedback = configurarDependencias(api);
    feedback.confirmar.mockResolvedValue(true);

    const fixture = TestBed.createComponent(ReportesBandasVistaComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    expect(component.puedeReactivarBandasSeccion()).toBe(true);
    await component.reactivarBandasSeccion();

    expect(feedback.confirmar).toHaveBeenCalled();
    expect(reactivarBandasSeccion).toHaveBeenCalledWith({ anio: 2026, nivel: 11, numero: 1, semestre: 'II_SEMESTRE' });
    expect(feedback.exito).toHaveBeenCalled();
  });

  it('solo permite reactivar una monografía confirmada y conserva bloqueada la no confirmada', async () => {
    const pendiente = monografia('1', 'Pendiente');
    const confirmada = monografia('2', 'Confirmada');
    const reportes: ReporteMonografiaGuiaApi[] = [
      { cedulaEstudiante: '1', nombreEstudiante: 'Pendiente', codigoAsignatura: 'HIS', asignatura: 'Historia', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Borrador', enviadoEn: null },
      { cedulaEstudiante: '2', nombreEstudiante: 'Confirmada', codigoAsignatura: 'HIS', asignatura: 'Historia', nombreCoordinador: 'Coordinador', estado: 'INVESTIGACION', observaciones: 'Informe final', enviadoEn: '2026-10-20T10:00:00Z' },
    ];
    const permitirCambiosReporteMonografia = vi.fn(() => of(undefined));
    const api = {
      obtenerPeriodoActual: () => of(periodo),
      listarSecciones: () => of([seccion]),
      listarMonografias: () => of([seguimiento(pendiente), seguimiento(confirmada)]),
      listarReportesMonografia: () => of(reportes),
      permitirCambiosReporteMonografia,
    } as unknown as ProfesorGuiaApiService;
    const feedback = configurarDependencias(api);
    feedback.confirmar.mockResolvedValue(true);

    const fixture = TestBed.createComponent(VerificacionMonografiasVistaComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const items = component.reports();
    const itemPendiente = items.find((item: { cedula: string }) => item.cedula === '1');
    const itemConfirmada = items.find((item: { cedula: string }) => item.cedula === '2');

    await component.permitirCambios(itemPendiente);
    expect(permitirCambiosReporteMonografia).not.toHaveBeenCalled();
    await component.permitirCambios(itemConfirmada);
    expect(permitirCambiosReporteMonografia).toHaveBeenCalledWith({ anio: 2026, nivel: 11, numero: 1, semestre: 'II_SEMESTRE' }, '2');
    expect(feedback.exito).toHaveBeenCalled();
  });
});
