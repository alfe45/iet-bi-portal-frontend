import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../env/environment';
import { ProfesorGuiaApiService } from './profesor-guia-api.service';

describe('ProfesorGuiaApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [ProfesorGuiaApiService, provideHttpClient(), provideHttpClientTesting()] }));

  it('consulta los reportes de bandas con la sección y semestre', () => {
    const service = TestBed.inject(ProfesorGuiaApiService);
    const http = TestBed.inject(HttpTestingController);
    service.listarReportesBandas({ anio: 2026, nivel: 11, numero: 1, semestre: 'II_SEMESTRE' }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/profesor/guia/reporte-bandas`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual(['anio', 'nivel', 'numero', 'semestre']);
    expect(request.request.params.get('semestre')).toBe('II_SEMESTRE');
    request.flush([]);
    http.verify();
  });

  it('reactiva la edición de bandas de toda la sección', () => {
    const service = TestBed.inject(ProfesorGuiaApiService);
    const http = TestBed.inject(HttpTestingController);
    service.reactivarBandasSeccion({ anio: 2026, nivel: 11, numero: 1, semestre: 'II_SEMESTRE' }).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/profesor/guia/reporte-bandas/2026/11/1/reactivar/II_SEMESTRE`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({});
    request.flush(null);
    http.verify();
  });

  it('reactiva la edición de un reporte de monografía por estudiante', () => {
    const service = TestBed.inject(ProfesorGuiaApiService);
    const http = TestBed.inject(HttpTestingController);
    service.permitirCambiosReporteMonografia({ anio: 2026, nivel: 11, numero: 1, semestre: 'II_SEMESTRE' }, '1-2345-6789').subscribe();

    const request = http.expectOne(`${environment.apiUrl}/profesor/guia/monografias/reportes/2026/11/1/1-2345-6789/permitir-cambios/II_SEMESTRE`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({});
    request.flush(null);
    http.verify();
  });
});
