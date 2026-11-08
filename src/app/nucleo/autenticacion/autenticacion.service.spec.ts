import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';
import { environment } from '../../../env/environment';

describe('AutenticacionService', () => {
  const router = { navigateByUrl: vi.fn() };

  beforeEach(() => {
    localStorage.removeItem('iet-bi-portal:sesion:v1');
    localStorage.removeItem('iet-bi-portal:sesion:v2');
    router.navigateByUrl.mockReset();
    TestBed.configureTestingModule({ providers: [AutenticacionService, provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }] });
  });

  it('requires non-empty credentials', () => {
    const service = TestBed.inject(AutenticacionService);
    service.iniciarSesion('', '').subscribe({ error: () => undefined });
    expect(service.authenticated()).toBe(false);
  });

  it('authenticates against the API and closes the remote session', () => {
    const service = TestBed.inject(AutenticacionService);
    const http = TestBed.inject(HttpTestingController);
    service.iniciarSesion('docente@iet.test', 'demo1234').subscribe();

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: 'access', accessTokenExpiresAt: '2026-09-25T12:00:00Z', refreshToken: 'refresh' });
    http.expectOne(`${environment.apiUrl}/perfil`).flush({ id: 'user-1', email: 'docente@iet.test', activo: true, roles: ['PROFESOR_REGULAR'], nombreProfesor: 'Docente Demo' });

    expect(service.authenticated()).toBe(true);
    expect(service.currentRole()).toBe('Profesor regular');
    expect(service.currentDisplayName()).toBe('Docente Demo');

    service.cerrarSesion();
    http.expectOne(`${environment.apiUrl}/auth/logout`).flush({});
    expect(service.currentRole()).toBeNull();
    expect(localStorage.getItem('iet-bi-portal:sesion:v2')).toBeNull();
    http.verify();
  });

  it('redirects to login when the session expires', () => {
    const service = TestBed.inject(AutenticacionService);
    service.expirarSesion();

    expect(service.authenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('shares a concurrent token renewal so the rotated refresh token is used once', () => {
    const service = TestBed.inject(AutenticacionService);
    const http = TestBed.inject(HttpTestingController);
    service.iniciarSesion('docente@iet.test', 'demo1234').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: 'access', accessTokenExpiresAt: '2026-09-25T12:00:00Z', refreshToken: 'refresh' });
    http.expectOne(`${environment.apiUrl}/perfil`).flush({ id: 'user-1', email: 'docente@iet.test', activo: true, roles: ['PROFESOR_REGULAR'], nombreProfesor: 'Docente Demo' });

    const results: string[] = [];
    service.renovarAccessToken().subscribe((token) => results.push(token));
    service.renovarAccessToken().subscribe((token) => results.push(token));

    const renewals = http.match(`${environment.apiUrl}/auth/refresh`);
    expect(renewals).toHaveLength(1);
    renewals[0].flush({ accessToken: 'access-2', accessTokenExpiresAt: '2026-09-25T13:00:00Z', refreshToken: 'refresh-2' });

    expect(results).toEqual(['access-2', 'access-2']);
    // RD-053: el par rotado queda persistido para recargas y otras pestañas.
    expect(JSON.parse(localStorage.getItem('iet-bi-portal:sesion:v2') ?? '{}').refreshToken).toBe('refresh-2');
    http.verify();
  });

  it('uses the tokens rotated by another tab instead of renewing with the old refresh token', () => {
    const service = TestBed.inject(AutenticacionService);
    const http = TestBed.inject(HttpTestingController);
    service.iniciarSesion('docente@iet.test', 'demo1234').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ accessToken: 'access', accessTokenExpiresAt: '2026-09-25T12:00:00Z', refreshToken: 'refresh' });
    http.expectOne(`${environment.apiUrl}/perfil`).flush({ id: 'user-1', email: 'docente@iet.test', activo: true, roles: ['PROFESOR_REGULAR'], nombreProfesor: 'Docente Demo' });

    const guardada = JSON.parse(localStorage.getItem('iet-bi-portal:sesion:v2') ?? '{}');
    localStorage.setItem('iet-bi-portal:sesion:v2', JSON.stringify({ ...guardada, accessToken: 'access-otra', refreshToken: 'refresh-otra' }));

    const results: string[] = [];
    service.renovarAccessToken().subscribe((token) => results.push(token));

    http.expectNone(`${environment.apiUrl}/auth/refresh`);
    expect(results).toEqual(['access-otra']);
    expect(service.refreshTokenValue()).toBe('refresh-otra');
    http.verify();
  });
});
