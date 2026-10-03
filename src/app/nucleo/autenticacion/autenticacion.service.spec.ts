import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';

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

    http.expectOne('http://localhost:5149/api/auth/login').flush({ accessToken: 'access', accessTokenExpiresAt: '2026-09-25T12:00:00Z', refreshToken: 'refresh' });
    http.expectOne('http://localhost:5149/api/perfil').flush({ id: 'user-1', email: 'docente@iet.test', activo: true, roles: ['PROFESOR_REGULAR'], nombreProfesor: 'Docente Demo' });

    expect(service.authenticated()).toBe(true);
    expect(service.currentRole()).toBe('Profesor regular');
    expect(service.currentDisplayName()).toBe('Docente Demo');

    service.cerrarSesion();
    http.expectOne('http://localhost:5149/api/auth/logout').flush({});
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
});
