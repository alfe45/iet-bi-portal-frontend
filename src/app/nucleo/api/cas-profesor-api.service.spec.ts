import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../env/environment';
import { CasProfesorApiService } from './cas-profesor-api.service';

describe('CasProfesorApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [CasProfesorApiService, provideHttpClient(), provideHttpClientTesting()] }));

  it('consulta el progreso de la sección CAS del semestre', () => {
    const service = TestBed.inject(CasProfesorApiService);
    const http = TestBed.inject(HttpTestingController);

    service.progreso(2026, 11, 52, 'II_SEMESTRE').subscribe();
    const request = http.expectOne((item) => item.url === `${environment.apiUrl}/profesor/cas/informes`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('anio')).toBe('2026');
    expect(request.request.params.get('nivel')).toBe('11');
    expect(request.request.params.get('numero')).toBe('52');
    expect(request.request.params.get('semestre')).toBe('II_SEMESTRE');
    request.flush([]);
    http.verify();
  });

  it('lee y reemplaza el informe por año, semestre y cédula', () => {
    const service = TestBed.inject(CasProfesorApiService);
    const http = TestBed.inject(HttpTestingController);

    service.obtener(2026, 'II_SEMESTRE', 'S-2026-101').subscribe();
    http.expectOne(`${environment.apiUrl}/profesor/cas/informes/2026/II_SEMESTRE/S-2026-101`).flush({});

    service.guardar(2026, 'II_SEMESTRE', 'S-2026-101', { perfil: true, entrevista1: true, entrevista2: false, entrevistaFinal: false, observaciones: null, experiencias: [] }).subscribe();
    const put = http.expectOne(`${environment.apiUrl}/profesor/cas/informes/2026/II_SEMESTRE/S-2026-101`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(expect.objectContaining({ perfil: true, experiencias: [] }));
    put.flush(null);
    http.verify();
  });

  it('consulta el progreso global de Coordinación CAS', () => {
    const service = TestBed.inject(CasProfesorApiService);
    const http = TestBed.inject(HttpTestingController);

    service.progresoGeneral({ anio: 2026, semestre: 'II_SEMESTRE' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/profesor/coordinacion-cas/progreso?anio=2026&semestre=II_SEMESTRE`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
    http.verify();
  });

  it('consulta los informes globales de un estudiante CAS', () => {
    const service = TestBed.inject(CasProfesorApiService);
    const http = TestBed.inject(HttpTestingController);

    service.informesEstudiante(2026, 'II_SEMESTRE', '8-700-101').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/profesor/coordinacion-cas/informes/2026/II_SEMESTRE/8-700-101`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
    http.verify();
  });
});
