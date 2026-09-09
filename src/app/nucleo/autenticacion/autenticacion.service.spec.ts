import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';

describe('AutenticacionService', () => {
  const router = { navigateByUrl: vi.fn() };

  beforeEach(() => {
    localStorage.removeItem('iet-bi-portal:sesion:v1');
    router.navigateByUrl.mockReset();
    TestBed.configureTestingModule({ providers: [AutenticacionService, { provide: Router, useValue: router }] });
  });

  it('requires non-empty credentials', () => {
    const service = TestBed.inject(AutenticacionService);
    expect(service.iniciarSesion('', '', 'Administrador')).toBe(false);
    expect(service.authenticated()).toBe(false);
  });

  it('persists and closes the local session', () => {
    const service = TestBed.inject(AutenticacionService);
    expect(service.iniciarSesion('docente', 'demo', 'Profesor regular')).toBe(true);
    expect(service.currentRole()).toBe('Profesor regular');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');

    service.cerrarSesion();
    expect(service.currentRole()).toBeNull();
    expect(localStorage.getItem('iet-bi-portal:sesion:v1')).toBeNull();
  });
});
