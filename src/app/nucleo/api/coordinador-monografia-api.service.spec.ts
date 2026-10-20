import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CoordinadorMonografiaApiService } from './coordinador-monografia-api.service';
import { environment } from '../../../env/environment';

describe('CoordinadorMonografiaApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [CoordinadorMonografiaApiService, provideHttpClient(), provideHttpClientTesting()] }));

  it('consulta las monografías del coordinador y el detalle por cédula', () => {
    const service = TestBed.inject(CoordinadorMonografiaApiService);
    const http = TestBed.inject(HttpTestingController);
    let detalle: unknown;

    service.listar().subscribe();
    const list = http.expectOne(`${environment.apiUrl}/profesor/monografias`);
    expect(list.request.method).toBe('GET');
    list.flush([]);

    service.obtener('1-2345-6789').subscribe((value) => detalle = value);
    const get = http.expectOne(`${environment.apiUrl}/profesor/monografias/1-2345-6789`);
    expect(get.request.method).toBe('GET');
    get.flush({ monografia: {}, seguimientos: [], reportes: [] });
    expect(detalle).toEqual({ monografia: {}, seguimientos: [], reportes: [] });
    http.verify();
  });

  it('actualiza el estado y envía las observaciones del semestre', () => {
    const service = TestBed.inject(CoordinadorMonografiaApiService);
    const http = TestBed.inject(HttpTestingController);

    service.cambiarEstado('1-2345-6789', 'INVESTIGACION').subscribe();
    const state = http.expectOne(`${environment.apiUrl}/profesor/monografias/1-2345-6789/estado`);
    expect(state.request.method).toBe('PUT');
    expect(state.request.body).toEqual({ estado: 'INVESTIGACION' });
    state.flush(null);

    service.enviarReporte('1-2345-6789', 2026, 'II_SEMESTRE', 'Avance revisado').subscribe();
    const report = http.expectOne(`${environment.apiUrl}/profesor/monografias/1-2345-6789/reportes/2026/II_SEMESTRE`);
    expect(report.request.method).toBe('PUT');
    expect(report.request.body).toEqual({ observaciones: 'Avance revisado' });
    report.flush(null);
    http.verify();
  });
});