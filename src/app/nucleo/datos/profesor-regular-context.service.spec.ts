import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { ProfesorRegularContextService } from './profesor-regular-context.service';
import { ProfesorRegularApiService } from '../api/profesor-regular-api.service';
import { environment } from '../../../env/environment';

describe('ProfesorRegularContextService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [AutenticacionService, ProfesorRegularApiService, ProfesorRegularContextService, provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: { navigateByUrl: vi.fn() } }] }));

  it('carga periodo, asignaciones, avisos y estudiantes sin usar datos locales', () => {
    const auth = TestBed.inject(AutenticacionService);
    auth.currentRoles.set(['Profesor regular']);
    auth.currentDisplayName.set('Docente API');
    const context = TestBed.inject(ProfesorRegularContextService);
    const http = TestBed.inject(HttpTestingController);

    context.iniciar();
    http.expectOne(`${environment.apiUrl}/periodos/actual`).flush({ anio: 2026, inicioSemestreI: '2026-02-01', finSemestreI: '2026-06-30', inicioSemestreII: '2026-07-01', finSemestreII: '2026-12-01', estado: 'ACTIVO', semestreActual: 'II_SEMESTRE' });
    http.expectOne((request) => request.url === `${environment.apiUrl}/profesor/asignaciones` && request.params.get('anio') === '2026').flush([{ anio: 2026, nivel: 11, numero: 1, seccion: '11-1', codigoAsignatura: 'HIS', asignatura: 'Historia', cedulaProfesor: '8-1', nombreProfesor: 'Docente API' }]);
    http.expectOne(`${environment.apiUrl}/profesor/pantalla-principal`).flush([{ id: 1, titulo: 'Aviso' }]);
    http.expectOne(`${environment.apiUrl}/profesor/secciones/2026/11/1/estudiantes`).flush([{ anio: 2026, nivel: 11, numero: 1, seccion: '11-1', cedulaEstudiante: '1-2', nombreEstudiante: 'Estudiante Real', fechaMatricula: '2026-02-01', estado: 'ACTIVO', fechaRetiro: null, motivoRetiro: null }]);

    expect(context.periodoEtiqueta()).toBe('Segundo semestre 2026');
    expect(context.asignaciones()[0].estudiantes[0]).toEqual(expect.objectContaining({ id: '1-2', nombre: 'Estudiante Real', seccion: '11-1' }));
    expect(context.asignaciones()[0].periodo).toBe('Segundo semestre 2026');
    http.verify();
  });
});
