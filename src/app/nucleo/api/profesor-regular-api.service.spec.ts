import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfesorRegularApiService } from './profesor-regular-api.service';
import { environment } from '../../../env/environment';

describe('ProfesorRegularApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [ProfesorRegularApiService, provideHttpClient(), provideHttpClientTesting()] }));

  it('consulta asignaciones del año y normaliza una colección envuelta', () => {
    const service = TestBed.inject(ProfesorRegularApiService);
    const http = TestBed.inject(HttpTestingController);
    let result: unknown;

    service.listarAsignaciones(2026).subscribe((value) => result = value);
    const request = http.expectOne((item) => item.url === `${environment.apiUrl}/profesor/asignaciones` && item.params.get('anio') === '2026');
    expect(request.request.method).toBe('GET');
    request.flush({ elementos: [{ anio: 2026, nivel: 11, numero: 1, seccion: '11-1', codigoAsignatura: 'HIS', asignatura: 'Historia', cedulaProfesor: '8-1', nombreProfesor: 'Docente' }] });

    expect(result).toEqual([expect.objectContaining({ codigoAsignatura: 'HIS' })]);
    http.verify();
  });

  it('envía el objeto de notas y construye la ruta completa de eliminación', () => {
    const service = TestBed.inject(ProfesorRegularApiService);
    const http = TestBed.inject(HttpTestingController);
    const consulta = { anio: 2026, nivel: 11, numero: 1, codigoAsignatura: 'HIS', semestre: 'II_SEMESTRE' };

    service.actualizarEvaluaciones(consulta, [{ cedulaEstudiante: '1-2', nota: '6', observaciones: 'Avance' }]).subscribe();
    const update = http.expectOne((item) => item.url === `${environment.apiUrl}/profesor/evaluaciones`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ ...consulta, notas: [{ cedulaEstudiante: '1-2', nota: '6', observaciones: 'Avance' }] });
    update.flush(null);

    service.borrarEvaluacion(consulta, '1-2').subscribe();
    const deletion = http.expectOne((item) => item.url === `${environment.apiUrl}/profesor/evaluaciones/2026/11/1/HIS/II_SEMESTRE/1-2`);
    expect(deletion.request.method).toBe('DELETE');
    expect(deletion.request.params.keys()).toEqual([]);
    deletion.flush(null);
    http.verify();
  });

  it('confirma las notas de la asignación en la ruta de confirmación', () => {
    const service = TestBed.inject(ProfesorRegularApiService);
    const http = TestBed.inject(HttpTestingController);
    const consulta = { anio: 2026, nivel: 11, numero: 1, codigoAsignatura: 'HIS', semestre: 'II_SEMESTRE' };

    service.confirmarEvaluaciones(consulta).subscribe();
    const confirmacion = http.expectOne(`${environment.apiUrl}/profesor/evaluaciones/confirmacion`);
    expect(confirmacion.request.method).toBe('POST');
    expect(confirmacion.request.body).toEqual(consulta);
    confirmacion.flush(null);
    http.verify();
  });
});
