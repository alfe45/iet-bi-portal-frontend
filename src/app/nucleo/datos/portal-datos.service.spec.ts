import { PortalDatosService } from './portal-datos.service';

describe('PortalDatosService', () => {
  beforeEach(() => localStorage.removeItem('iet-bi-portal:datos:v4'));

  it('creates, updates and deletes administrative records', () => {
    const service = new PortalDatosService();
    const id = service.guardarRegistro('estudiantes', { nombre: 'Estudiante nuevo', cedula: '1-001', seccion: '11-1', correo: 'nuevo@estudiante.edu', estado: 'Activo' });

    expect(service.listar('estudiantes').some((student) => student.id === id)).toBe(true);

    service.guardarRegistro('estudiantes', { nombre: 'Nombre actualizado' }, id);
    expect(service.listar('estudiantes').find((student) => student.id === id)?.['nombre']).toBe('Nombre actualizado');

    service.eliminarRegistro('estudiantes', id);
    expect(service.listar('estudiantes').some((student) => student.id === id)).toBe(false);
  });

  it.each([
    ['usuarios', { nombre: 'Usuario CRUD', descripcion: 'Administrador', estado: 'Activo' }],
    ['profesores', { nombre: 'Profesor CRUD', cedula: '1-002', correo: 'crud@institucion.edu', estado: 'Activo' }],
    ['estudiantes', { nombre: 'Estudiante CRUD', cedula: '1-003', seccion: '11-1', correo: 'crud@estudiante.edu', estado: 'Activo' }],
    ['periodos', { nombre: 'Periodo CRUD', descripcion: 'Periodo de prueba', estado: 'Inactivo' }],
    ['secciones', { nombre: '12-1', nivel: 'Duodécimo', guia: 'Profesor CRUD', estado: 'Activa' }],
    ['matriculas', { estudiante: 'Estudiante CRUD', seccion: '12-1', periodo: 'Periodo CRUD', estado: 'Activa' }],
    ['escalas', { nombre: 'Escala CRUD', rango: '1-10', estado: 'Activa' }],
    ['asignaturas', { nombre: 'Asignatura CRUD', descripcion: 'Asignatura de prueba', escala: '1-7', estado: 'Activa' }],
    ['asignaciones', { profesor: 'Profesor CRUD', asignatura: 'Asignatura CRUD', seccion: '12-1', periodo: 'Periodo CRUD', estado: 'Activa' }],
  ] as const)('supports the full CRUD lifecycle for %s', (key, values) => {
    const service = new PortalDatosService();
    const id = service.guardarRegistro(key, { ...values });
    expect(service.listar(key).some((record) => record.id === id)).toBe(true);
    service.guardarRegistro(key, { ...values, estado: key === 'matriculas' ? 'Retirada' : 'Inactivo' }, id);
    expect(service.listar(key).find((record) => record.id === id)?.['estado']).toBe(key === 'matriculas' ? 'Retirada' : 'Inactivo');
    service.eliminarRegistro(key, id);
    expect(service.listar(key).some((record) => record.id === id)).toBe(false);
  });

  it('persists evaluations and attendance between service instances', () => {
    const service = new PortalDatosService();
    service.guardarEvaluacion({ estudianteId: 'E-001', valor: '7', observacion: 'Actualizada' });
    service.guardarAsistencia({ estudianteId: 'E-001', tardias: 3, justificadas: 1, injustificadas: 0 });

    const restored = new PortalDatosService();
    expect(restored.evaluacion('E-001').valor).toBe('7');
    expect(restored.asistencia('E-001').tardias).toBe(3);
  });

  it('provides academic data for every demo student', () => {
    const service = new PortalDatosService();

    for (const student of service.estudiantes()) {
      expect(service.evaluacion(student.id).valor).not.toBe('');
      expect(service.evaluacion(student.id).observacion).not.toBe('');
      expect(service.asistencia(student.id)).toEqual(expect.objectContaining({ estudianteId: student.id }));
    }
  });

  it('adds a persisted monograph follow-up', () => {
    const service = new PortalDatosService();
    service.agregarSeguimiento('M-301', { fecha: '2026-09-08', estado: 'Revisado', observacion: 'Nuevo avance', profesor: 'Ana Lucía Solano Castro' });

    expect(new PortalDatosService().monografia('M-301')?.seguimientos.at(-1)?.observacion).toBe('Nuevo avance');
  });
});
