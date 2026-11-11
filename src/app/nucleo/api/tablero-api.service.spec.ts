import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../env/environment';
import { TableroApiService } from './tablero-api.service';

describe('TableroApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [TableroApiService, provideHttpClient(), provideHttpClientTesting()] }));

  it('sin año pide el curso lectivo en curso', () => {
    const service = TestBed.inject(TableroApiService);
    const http = TestBed.inject(HttpTestingController);

    service.obtener().subscribe();
    const request = http.expectOne((item) => item.url === `${environment.apiUrl}/admin/tablero`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('anio')).toBe(false);
    request.flush({ periodo: null, aniosDisponibles: [], alertas: [], actividad: [] });
    http.verify();
  });

  it('con año lo envía como parámetro', () => {
    const service = TestBed.inject(TableroApiService);
    const http = TestBed.inject(HttpTestingController);

    service.obtener(2025).subscribe();
    const request = http.expectOne((item) => item.url === `${environment.apiUrl}/admin/tablero`);
    expect(request.request.params.get('anio')).toBe('2025');
    request.flush({ periodo: null, aniosDisponibles: [], alertas: [], actividad: [] });
    http.verify();
  });
});
