import { Injectable, signal } from '@angular/core';

export type FuncionalidadAdministrativa =
  | 'usuarios'
  | 'profesores'
  | 'estudiantes'
  | 'periodos'
  | 'secciones'
  | 'matriculas'
  | 'escalas'
  | 'asignaturas'
  | 'asignaciones';

export interface RegistroPortal {
  id: string;
  [key: string]: string;
}

export interface EvaluacionLocal {
  estudianteId: string;
  valor: string;
  observacion: string;
  asignatura?: string;
  seccion?: string;
  periodo?: string;
}

export interface AusentismoLocal {
  estudianteId: string;
  tardias: number;
  justificadas: number;
  injustificadas: number;
  asignatura?: string;
  seccion?: string;
  periodo?: string;
}

export interface SeguimientoLocal {
  id: string;
  fecha: string;
  estado: string;
  observacion: string;
  profesor: string;
}

export interface MonografiaLocal {
  id: string;
  estudiante: string;
  titulo: string;
  area: string;
  coordinador: string;
  estado: string;
  fechaInicio: string;
  descripcion: string;
  observacionReporte?: string;
  fechaInforme?: string;
  informeEnviado?: boolean;
  fechaEnvioInforme?: string;
  mensajeEnvioInforme?: string;
  seguimientos: SeguimientoLocal[];
}

export interface CasActivityLocal {
  id: string;
  proyecto: string;
  fechas: string[];
  creatividad: boolean;
  actividad: boolean;
  servicio: boolean;
  resultados: boolean[];
  carpeta: boolean;
  reflexion: boolean;
  pruebas: boolean;
}

export interface CasStudentLocal {
  id: string;
  estudiante: string;
  seccion: string;
  correo: string;
  profesorCas: string;
  periodo: string;
  actividades: CasActivityLocal[];
  perfil: boolean;
  entrevistaI: boolean;
  entrevistaII: boolean;
  entrevistaIII: boolean;
  entrevistaFinal: boolean;
  observaciones: string;
}

export type RolCas = 'Sin asignación CAS' | 'Profesor CAS' | 'Profesor Coordinador de CAS';
export type ResponsabilidadProfesor = 'Profesor CAS' | 'Profesor Coordinador de CAS' | 'Profesor Guía';

export interface AsignacionResponsabilidadLocal {
  id: string;
  cedula: string;
  profesor: string;
  responsabilidad: ResponsabilidadProfesor;
  seccion?: string;
  estado?: string;
}

export interface AsignacionCasLocal {
  id: string;
  estudiante: string;
  profesor: string;
  seccion: string;
  estado?: string;
}

interface EstadoPortal {
  version: 4;
  registros: Record<FuncionalidadAdministrativa, RegistroPortal[]>;
  evaluaciones: EvaluacionLocal[];
  ausentismo: AusentismoLocal[];
  monografias: MonografiaLocal[];
  cas: CasStudentLocal[];
  rolesCas?: Record<string, RolCas>;
  asignacionesResponsabilidad?: AsignacionResponsabilidadLocal[];
  asignacionesCas?: AsignacionCasLocal[];
  enviosRegistro?: Array<{ grupoId: string; periodo: string; fecha: string }>;
}

const STORAGE_KEY = 'iet-bi-portal:datos:v4';

const NOMBRES_ESTUDIANTES_DEMO = [
  'Andrea Sofía Vargas Solano', 'Valeria Fernanda Mora Jiménez', 'Daniel Alejandro Chaves Rojas', 'Camila Isabel Brenes Castro', 'Sebastián Andrés Quesada León',
  'Natalia Gabriela Zúñiga Arias', 'Mateo Esteban Villalobos Rojas', 'Mariana José Porras Méndez', 'Emiliano David Salazar Cordero', 'Luciana María Alfaro Vargas',
  'Gabriel Antonio Calderón Soto', 'Isabella Valentina Hernández Mora', 'Santiago José Roldán Jiménez', 'Paula Andrea Carvajal Solís', 'Tomás Ignacio Méndez Ramírez',
  'Daniela Beatriz Arias Cordero', 'Nicolás Eduardo Sandí Vargas', 'María José Obando Castro', 'Luis Fernando Céspedes Rojas', 'Sofía Alejandra Montero León',
  'Juan Diego Madrigal Solano', 'Ana Lucía Chacón Méndez', 'Álvaro Sebastián Segura Jiménez', 'Victoria Elena Salas Brenes', 'Marco Antonio Ureña Vargas',
  'Gabriela María Corrales Soto', 'José Manuel Retana Castro', 'Fernanda Isabel Valverde Mora', 'Carlos Andrés Rojas Quesada', 'Laura Valentina Esquivel Arias',
  'Mauricio Adrián Fonseca Solano', 'Pía Carolina Cordero Jiménez', 'Esteban Rafael Naranjo Vargas', 'Karla María Hidalgo Rojas', 'Rodrigo Alberto Céspedes Mora',
];

const ESTUDIANTES_DEMO: RegistroPortal[] = [
  { id: 'E-001', nombre: 'José Luis Rodríguez Mora', cedula: '8-734-401', seccion: '11-1', correo: 'jose.rodriguez@estudiante.edu', estado: 'Activo' },
  { id: 'E-002', nombre: 'María Fernanda Jiménez Vargas', cedula: '8-811-109', seccion: '11-1', correo: 'maria.jimenez@estudiante.edu', estado: 'Activo' },
  { id: 'E-003', nombre: 'Carlos Eduardo Araya Rojas', cedula: '8-744-002', seccion: '11-1', correo: 'carlos.araya@estudiante.edu', estado: 'Activo' },
  { id: 'E-004', nombre: 'Sofía Valeria Cordero Méndez', cedula: '8-755-018', seccion: '11-2', correo: 'sofia.cordero@estudiante.edu', estado: 'Activo' },
  { id: 'E-005', nombre: 'Diego Andrés Solís Vargas', cedula: '8-766-024', seccion: '11-2', correo: 'diego.solis@estudiante.edu', estado: 'Activo' },
  ...Array.from({ length: 35 }, (_, index) => {
    const number = index + 6;
    const section = number <= 22 ? '11-1' : '11-2';
    return { id: `E-${String(number).padStart(3, '0')}`, nombre: NOMBRES_ESTUDIANTES_DEMO[index], cedula: `8-${String(800 + number).padStart(3, '0')}-${String(400 + number).padStart(3, '0')}`, seccion: section, correo: `estudiante${number}@estudiante.edu`, estado: 'Activo' };
  }),
];

const EVALUACIONES_DEMO: EvaluacionLocal[] = ESTUDIANTES_DEMO.map((student, index) => ({
  estudianteId: student.id,
  valor: String(4 + (index % 4)),
  observacion: index % 4 === 0 ? 'Desempeño sobresaliente.' : index % 4 === 1 ? 'Buen avance en los aprendizajes.' : index % 4 === 2 ? 'Debe reforzar algunos contenidos.' : 'Cumple con los objetivos del periodo.',
}));

const AUSENTISMO_DEMO: AusentismoLocal[] = ESTUDIANTES_DEMO.map((student, index) => ({
  estudianteId: student.id,
  tardias: index % 4 === 0 ? 0 : index % 4,
  justificadas: index % 5 === 0 ? 1 : 0,
  injustificadas: index % 7 === 0 ? 1 : 0,
}));

const CAS_PROFESORES_DEMO = ['Efraín Aguilar Madriz', 'Laura Vanessa Quirós Brenes'];
const casActivity = (id: string): CasActivityLocal => ({ id, proyecto: '', fechas: ['', ''], creatividad: false, actividad: false, servicio: false, resultados: Array.from({ length: 7 }, () => false), carpeta: false, reflexion: false, pruebas: false });
const CAS_DEMO: CasStudentLocal[] = [
  { id: 'CAS-001', estudiante: 'José Luis Rodríguez Mora', seccion: '11-1', correo: 'jose.rodriguez@estudiante.edu', profesorCas: CAS_PROFESORES_DEMO[0], periodo: 'I SEMESTRE 2026', actividades: [{ ...casActivity('CAS-001-1'), proyecto: 'Recibimiento de los 12° BI', fechas: ['06-03', ''], actividad: true, resultados: [true, true, false, false, false, true, false], carpeta: true, reflexion: true, pruebas: true }, { ...casActivity('CAS-001-2'), proyecto: 'Trabajo de zona verde costado norte del IET', fechas: ['13-03', ''], actividad: true, servicio: true, resultados: [false, true, false, true, true, false, true], carpeta: true, reflexion: true, pruebas: true }, { ...casActivity('CAS-001-3'), proyecto: 'Trabajo de zona verde frente al comedor IET', fechas: ['20-03', ''], actividad: true, servicio: true, resultados: [false, true, false, true, true, false, true], carpeta: true, reflexion: true, pruebas: true }, { ...casActivity('CAS-001-4'), proyecto: 'Recibimiento de exposición de Carpetas de CAS 12°', fechas: ['27-03', ''], creatividad: true, actividad: true, resultados: [true, true, false, false, false, false, true], carpeta: true, reflexion: true, pruebas: true }], perfil: true, entrevistaI: true, entrevistaII: false, entrevistaIII: false, entrevistaFinal: false, observaciones: '' },
  { id: 'CAS-002', estudiante: 'María Fernanda Jiménez Vargas', seccion: '11-1', correo: 'maria.jimenez@estudiante.edu', profesorCas: CAS_PROFESORES_DEMO[1], periodo: 'I SEMESTRE 2026', actividades: [casActivity('CAS-002-1')], perfil: false, entrevistaI: false, entrevistaII: false, entrevistaIII: false, entrevistaFinal: false, observaciones: '' },
  { id: 'CAS-003', estudiante: 'Carlos Eduardo Araya Rojas', seccion: '11-2', correo: 'carlos.araya@estudiante.edu', profesorCas: CAS_PROFESORES_DEMO[0], periodo: 'I SEMESTRE 2026', actividades: [casActivity('CAS-003-1')], perfil: false, entrevistaI: false, entrevistaII: false, entrevistaIII: false, entrevistaFinal: false, observaciones: '' },
];

EVALUACIONES_DEMO[0] = { estudianteId: 'E-001', valor: '6', observacion: 'Buen análisis de fuentes.' };
EVALUACIONES_DEMO[1] = { estudianteId: 'E-002', valor: '4', observacion: 'Debe reforzar el análisis.' };
EVALUACIONES_DEMO[2] = { estudianteId: 'E-003', valor: '7', observacion: 'Desempeño sobresaliente.' };

const ESTADO_INICIAL: EstadoPortal = {
  version: 4,
  registros: {
      usuarios: [
       { id: 'U-001', correo: 'admin@institucion.edu', password: 'demo2026', roles: 'Administrador', estado: 'Activo', ultimoLogin: '2026-09-25 08:00', creadoEn: '2026-01-10', intentosFallidosLogin: '0', bloqueadoHasta: '', contrasenaCambiadaEn: '2026-01-10', actualizadoEn: '2026-09-25', tokensInvalidadosDesde: '' },
       { id: 'U-002', correo: 'juan.valverde@institucion.edu', password: 'demo2026', roles: 'Profesor regular|Profesor Guía', estado: 'Activo', ultimoLogin: '2026-09-24 16:30', creadoEn: '2026-01-12', intentosFallidosLogin: '0', bloqueadoHasta: '', contrasenaCambiadaEn: '2026-01-12', actualizadoEn: '2026-09-24', tokensInvalidadosDesde: '' },
       { id: 'U-003', correo: 'laura.quiros@institucion.edu', password: 'demo2026', roles: 'Profesor Guía|Profesor CAS', estado: 'Activo', ultimoLogin: '2026-09-23 10:15', creadoEn: '2026-01-14', intentosFallidosLogin: '0', bloqueadoHasta: '', contrasenaCambiadaEn: '2026-01-14', actualizadoEn: '2026-09-23', tokensInvalidadosDesde: '' },
       { id: 'U-004', correo: 'ana.solano@institucion.edu', password: 'demo2026', roles: 'Profesor Coordinador de Monografía', estado: 'Activo', ultimoLogin: '2026-09-22 14:40', creadoEn: '2026-01-16', intentosFallidosLogin: '0', bloqueadoHasta: '', contrasenaCambiadaEn: '2026-01-16', actualizadoEn: '2026-09-22', tokensInvalidadosDesde: '' },
      ],
     profesores: [
       { id: 'P-001', usuarioId: 'U-002', nombre: 'Juan Gabriel', nombreCompleto: 'Juan Gabriel Valverde Valverde', primerApellido: 'Valverde', segundoApellido: 'Valverde', cedula: '8-700-101', correo: 'juan.valverde@institucion.edu', numeroCelular: '8888-0101', fechaNacimiento: '1983-04-12' },
       { id: 'P-002', usuarioId: 'U-003', nombre: 'Laura Vanessa', nombreCompleto: 'Laura Vanessa Quirós Brenes', primerApellido: 'Quirós', segundoApellido: 'Brenes', cedula: '8-701-102', correo: 'laura.quiros@institucion.edu', numeroCelular: '8888-0102', fechaNacimiento: '1986-09-23' },
       { id: 'P-003', usuarioId: 'U-004', nombre: 'Ana Lucía', nombreCompleto: 'Ana Lucía Solano Castro', primerApellido: 'Solano', segundoApellido: 'Castro', cedula: '8-702-103', correo: 'ana.solano@institucion.edu', numeroCelular: '8888-0103', fechaNacimiento: '1981-11-08' },
     ],
    estudiantes: ESTUDIANTES_DEMO,
     periodos: [{ id: 'PER-2026-2', nombre: 'Segundo semestre 2026', yearCiclo: '2026', fechaInicio: '2026-02-09', fechaFin: '2026-12-04', descripcion: 'Periodo académico vigente', estado: 'Activo' }],
      secciones: [{ id: 'SEC-11-1', nombre: '11-1', yearCiclo: '2026', nivel: 'Undécimo', guia: 'Laura Vanessa Quirós Brenes', estado: 'Activa' }, { id: 'SEC-11-2', nombre: '11-2', yearCiclo: '2026', nivel: 'Undécimo', guia: 'Laura Vanessa Quirós Brenes', estado: 'Activa' }],
     matriculas: ESTUDIANTES_DEMO.map((student, index) => ({ id: `MAT-${String(index + 1).padStart(3, '0')}`, estudiante: student['nombre'], seccion: student['seccion'], yearCiclo: '2026', periodo: 'Segundo semestre 2026', estado: 'Activa' })),
    escalas: [
      { id: 'ESC-1-7', nombre: 'Escala 1 a 7', rango: '1-7', estado: 'Activa' },
      { id: 'ESC-1-100', nombre: 'Escala 1 a 100', rango: '1-100', estado: 'Activa' },
      { id: 'ESC-A-E', nombre: 'Escala A a E', rango: 'A-E', estado: 'Activa' },
    ],
    asignaturas: [
       { id: 'ASG-HIS', codigo: 'HIS', nombre: 'Historia', descripcion: 'Procesos históricos contemporáneos', escala: '1-7', estado: 'Activa' },
       { id: 'ASG-MAT', codigo: 'MAT', nombre: 'Matemática AI', descripcion: 'Resolución de problemas y pensamiento lógico', escala: '1-100', estado: 'Activa' },
       { id: 'ASG-ESS', codigo: 'ESS', nombre: 'Estudios Sociales', descripcion: 'Análisis de contexto social y ciudadanía', escala: '1-100', estado: 'Activa' },
       { id: 'ASG-CIV', codigo: 'CIV', nombre: 'Cívica', descripcion: 'Ciudadanía, convivencia y participación democrática', escala: '1-100', estado: 'Activa' },
       { id: 'ASG-LIT', codigo: 'LIT', nombre: 'Literatura', descripcion: 'Lectura, análisis y producción literaria', escala: '1-7', estado: 'Activa' },
       { id: 'ASG-SDI', codigo: 'SDI', nombre: 'Sociedad Digital', descripcion: 'Cultura, comunicación y ciudadanía digital', escala: '1-7', estado: 'Activa' },
       { id: 'ASG-BIO', codigo: 'BIO', nombre: 'Biología', descripcion: 'Estudio de los seres vivos y sus procesos', escala: '1-7', estado: 'Activa' },
       { id: 'ASG-LEN', codigo: 'LEN', nombre: 'Lengua B', descripcion: 'Competencias comunicativas y producción escrita', escala: '1-7', estado: 'Activa' },
       { id: 'ASG-TDC', codigo: 'TDC', nombre: 'Teoría del Conocimiento', descripcion: 'Investigación y pensamiento crítico', escala: 'A-E', estado: 'Activa' },
    ],
    asignaciones: [
       { id: 'ACA-001', profesor: 'Juan Gabriel Valverde Valverde', codigo: 'HIS', asignatura: 'Historia', seccion: '11-1', periodo: 'Segundo semestre 2026', estado: 'Activa' },
        { id: 'ACA-002', profesor: 'Juan Gabriel Valverde Valverde', codigo: 'ESS', asignatura: 'Estudios Sociales', seccion: '11-1', periodo: 'Segundo semestre 2026', estado: 'Activa' },
        { id: 'ACA-004', profesor: 'Juan Gabriel Valverde Valverde', codigo: 'HIS', asignatura: 'Historia', seccion: '11-2', periodo: 'Segundo semestre 2026', estado: 'Activa' },
       { id: 'ACA-003', profesor: 'Laura Vanessa Quirós Brenes', codigo: 'TDC', asignatura: 'Teoría del Conocimiento', seccion: '11-1', periodo: 'Segundo semestre 2026', estado: 'Activa' },
    ],
  },
  evaluaciones: EVALUACIONES_DEMO,
  ausentismo: AUSENTISMO_DEMO,
  cas: CAS_DEMO,
  asignacionesCas: CAS_DEMO.map((item) => ({ id: `CAS-ASSIGN-${item.id}`, estudiante: item.estudiante, profesor: item.profesorCas, seccion: item.seccion, estado: 'Activo' })),
   monografias: [
     { id: 'M-301', estudiante: 'José Luis Rodríguez Mora', titulo: 'Lectura crítica y escritura argumentativa', area: 'Lengua A', coordinador: 'Ana Lucía Solano Castro', estado: 'En desarrollo', fechaInicio: '2026-08-05', descripcion: 'Monografía enfocada en la construcción de la pregunta de investigación y la introducción del trabajo escrito.', observacionReporte: 'Se presenta a las sesiones de coordinación con puntualidad.', fechaInforme: '2026-09-08', seguimientos: [{ id: 'SEG-001', fecha: '2026-08-22', estado: 'Revisado', observacion: 'Se presenta a las sesiones de coordinación con puntualidad.', profesor: 'Ana Lucía Solano Castro' }] },
     { id: 'M-204', estudiante: 'María Fernanda Jiménez Vargas', titulo: 'Modelos de reciclaje escolar', area: 'Estudios Sociales', coordinador: 'Ana Lucía Solano Castro', estado: 'Aprobada', fechaInicio: '2026-07-18', descripcion: 'Análisis de prácticas sostenibles aplicables a la institución.', observacionReporte: 'Marco teórico revisado y proyecto aprobado.', fechaInforme: '2026-09-08', seguimientos: [{ id: 'SEG-002', fecha: '2026-08-01', estado: 'Revisado', observacion: 'Marco teórico revisado.', profesor: 'Ana Lucía Solano Castro' }] },
     { id: 'M-101', estudiante: 'Carlos Eduardo Araya Rojas', titulo: 'Impacto social de la lectura digital', area: 'Teoría del Conocimiento', coordinador: 'Ana Lucía Solano Castro', estado: 'En desarrollo', fechaInicio: '2026-08-08', descripcion: 'Estudio sobre hábitos de lectura en medios digitales.', observacionReporte: 'Pendiente validar los instrumentos de investigación.', fechaInforme: '2026-09-08', seguimientos: [{ id: 'SEG-003', fecha: '2026-08-22', estado: 'Pendiente', observacion: 'Pendiente validar los instrumentos.', profesor: 'Ana Lucía Solano Castro' }] },
  ],
};

@Injectable({ providedIn: 'root' })
// Mantiene los registros locales usados por las vistas que todavía no tienen API.
export class PortalDatosService {
  private readonly estado = signal<EstadoPortal>(this.cargar());

  listar(funcionalidad: FuncionalidadAdministrativa): RegistroPortal[] {
    return this.estado().registros[funcionalidad];
  }

  guardarRegistro(funcionalidad: FuncionalidadAdministrativa, valores: Record<string, string>, id?: string): string {
    const registroId = id ?? this.nuevoId(funcionalidad.slice(0, 3).toUpperCase());
    this.actualizar((estado) => ({
      ...estado,
      registros: {
        ...estado.registros,
        [funcionalidad]: id
          ? estado.registros[funcionalidad].map((registro) => registro.id === id ? { ...registro, ...valores, id } : registro)
          : [...estado.registros[funcionalidad], { ...valores, id: registroId }],
      },
    }));
    return registroId;
  }

  eliminarRegistro(funcionalidad: FuncionalidadAdministrativa, id: string): void {
    this.actualizar((estado) => ({ ...estado, registros: { ...estado.registros, [funcionalidad]: estado.registros[funcionalidad].filter((registro) => registro.id !== id) } }));
  }

  validarEliminacion(funcionalidad: FuncionalidadAdministrativa, id: string): { permitido: boolean; motivo: string; relaciones: string[] } {
    const estado = this.estado();
    const registro = estado.registros[funcionalidad].find((item) => item.id === id);
    if (!registro) return { permitido: false, motivo: 'No se encontró el registro.', relaciones: [] };
    const relaciones: string[] = [];
    const coincide = (items: RegistroPortal[], key: string, value: string) => items.some((item) => item[key] === value);
    const nombre = registro['nombre'] ?? registro['nombreCompleto'] ?? '';
    const seccion = registro['seccion'] ?? registro['nombre'] ?? '';
    switch (funcionalidad) {
      case 'usuarios':
        if (coincide(estado.registros.profesores, 'usuarioId', id) || coincide(estado.registros.profesores, 'correo', registro['correo'] ?? '')) relaciones.push('perfil de profesor');
        break;
      case 'profesores':
        if ((estado.asignacionesResponsabilidad ?? []).some((item) => item.cedula === registro['cedula'])) relaciones.push('responsabilidades asignadas');
        if (coincide(estado.registros.asignaciones, 'profesor', nombre)) relaciones.push('asignaciones de profesores');
        if (estado.monografias.some((item) => item.coordinador === nombre)) relaciones.push('monografías');
        if (estado.cas.some((item) => item.profesorCas === nombre)) relaciones.push('participaciones CAS');
        break;
      case 'estudiantes':
        if (coincide(estado.registros.matriculas, 'estudiante', nombre) || coincide(estado.registros.matriculas, 'cedulaEstudiante', registro['cedula'] ?? '')) relaciones.push('matrículas');
        if (estado.monografias.some((item) => item.estudiante === nombre)) relaciones.push('monografía');
        if (estado.cas.some((item) => item.estudiante === nombre)) relaciones.push('participación CAS');
        if (estado.evaluaciones.some((item) => item.estudianteId === id) || estado.ausentismo.some((item) => item.estudianteId === id)) relaciones.push('registros académicos');
        break;
      case 'periodos':
        if (coincide(estado.registros.matriculas, 'periodo', nombre) || coincide(estado.registros.asignaciones, 'periodo', nombre) || estado.cas.some((item) => item.periodo === nombre)) relaciones.push('registros académicos del periodo');
        break;
      case 'secciones':
        if (coincide(estado.registros.matriculas, 'seccion', seccion) || coincide(estado.registros.asignaciones, 'seccion', seccion) || (estado.asignacionesResponsabilidad ?? []).some((item) => item.seccion === seccion)) relaciones.push('matrículas o asignaciones');
        break;
      case 'asignaturas':
        if (coincide(estado.registros.asignaciones, 'asignatura', nombre) || estado.monografias.some((item) => item.area === nombre)) relaciones.push('asignaciones o monografías');
        if (registro['tipoAsignatura'] === 'Troncal' || registro['tipo'] === 'Troncal') relaciones.push('asignatura troncal');
        break;
      case 'asignaciones':
        if (estado.evaluaciones.some((item) => item.asignatura === nombre) || estado.ausentismo.some((item) => item.asignatura === nombre)) relaciones.push('registros académicos');
        break;
    }
    return relaciones.length ? { permitido: false, motivo: `No se puede eliminar porque tiene relaciones: ${relaciones.join(', ')}.`, relaciones } : { permitido: true, motivo: '', relaciones: [] };
  }

  estudiantes(): RegistroPortal[] {
    return this.listar('estudiantes');
  }

  evaluacion(estudianteId: string): EvaluacionLocal {
    return this.estado().evaluaciones.find((item) => item.estudianteId === estudianteId) ?? { estudianteId, valor: '', observacion: '' };
  }

  evaluacionDeGrupo(estudianteId: string, grupo: { asignatura: string; seccion: string; periodo: string }): EvaluacionLocal {
    return this.estado().evaluaciones.find((item) => item.estudianteId === estudianteId && item.asignatura === grupo.asignatura && item.seccion === grupo.seccion && item.periodo === grupo.periodo)
      ?? this.estado().evaluaciones.find((item) => item.estudianteId === estudianteId && !item.asignatura)
      ?? { estudianteId, valor: '', observacion: '' };
  }

  guardarEvaluacion(evaluacion: EvaluacionLocal): void {
    this.actualizar((estado) => ({ ...estado, evaluaciones: this.upsert(estado.evaluaciones, evaluacion, 'estudianteId') }));
  }

  guardarEvaluacionDeGrupo(evaluacion: EvaluacionLocal): void {
    this.actualizar((estado) => ({ ...estado, evaluaciones: this.upsertGrupo(estado.evaluaciones, evaluacion) }));
  }

  asistencia(estudianteId: string): AusentismoLocal {
    return this.estado().ausentismo.find((item) => item.estudianteId === estudianteId) ?? { estudianteId, tardias: 0, justificadas: 0, injustificadas: 0 };
  }

  asistenciaDeGrupo(estudianteId: string, grupo: { asignatura: string; seccion: string; periodo: string }): AusentismoLocal {
    return this.estado().ausentismo.find((item) => item.estudianteId === estudianteId && item.asignatura === grupo.asignatura && item.seccion === grupo.seccion && item.periodo === grupo.periodo)
      ?? this.estado().ausentismo.find((item) => item.estudianteId === estudianteId && !item.asignatura)
      ?? { estudianteId, tardias: 0, justificadas: 0, injustificadas: 0 };
  }

  guardarAsistencia(asistencia: AusentismoLocal): void {
    const normalizada = { ...asistencia, tardias: this.entero(asistencia.tardias), justificadas: this.entero(asistencia.justificadas), injustificadas: this.entero(asistencia.injustificadas) };
    this.actualizar((estado) => ({ ...estado, ausentismo: this.upsert(estado.ausentismo, normalizada, 'estudianteId') }));
  }

  guardarAsistenciaDeGrupo(asistencia: AusentismoLocal): void {
    const normalizada = { ...asistencia, tardias: this.entero(asistencia.tardias), justificadas: this.entero(asistencia.justificadas), injustificadas: this.entero(asistencia.injustificadas) };
    this.actualizar((estado) => ({ ...estado, ausentismo: this.upsertGrupo(estado.ausentismo, normalizada) }));
  }

  registroEnviado(grupoId: string, periodo: string): boolean {
    return (this.estado().enviosRegistro ?? []).some((item) => item.grupoId === grupoId && item.periodo === periodo);
  }

  enviarRegistro(grupoId: string, periodo: string): void {
    if (this.registroEnviado(grupoId, periodo)) return;
    this.actualizar((estado) => ({ ...estado, enviosRegistro: [...(estado.enviosRegistro ?? []), { grupoId, periodo, fecha: new Date().toISOString() }] }));
  }

  monografias(): MonografiaLocal[] {
    return this.estado().monografias;
  }

  casEstudiantes(): CasStudentLocal[] {
    return this.estado().cas ?? [];
  }

  casProfesores(): string[] {
    return [...new Set(this.casEstudiantes().map((student) => student.profesorCas))];
  }

  guardarCasEstudiante(student: CasStudentLocal): void {
    this.actualizar((estado) => ({ ...estado, cas: estado.cas.map((item) => item.id === student.id ? structuredClone(student) : item) }));
  }

  rolCasDeProfesor(cedula: string): RolCas {
    return this.estado().rolesCas?.[cedula] ?? 'Sin asignación CAS';
  }

  guardarRolCas(cedula: string, rol: RolCas, cedulaAnterior?: string): void {
    this.actualizar((estado) => {
      const rolesCas = { ...(estado.rolesCas ?? {}) };
      if (cedulaAnterior && cedulaAnterior !== cedula) delete rolesCas[cedulaAnterior];
      if (rol === 'Sin asignación CAS') delete rolesCas[cedula];
      else rolesCas[cedula] = rol;
      return { ...estado, rolesCas };
    });
  }

  eliminarRolCas(cedula: string): void {
    this.actualizar((estado) => {
      const rolesCas = { ...(estado.rolesCas ?? {}) };
      delete rolesCas[cedula];
      return { ...estado, rolesCas };
    });
  }

  asignacionesResponsabilidad(): AsignacionResponsabilidadLocal[] {
    return this.estado().asignacionesResponsabilidad ?? [];
  }

  asignacionesCas(): AsignacionCasLocal[] {
    return this.estado().asignacionesCas ?? [];
  }

  guardarAsignacionCas(asignacion: AsignacionCasLocal): void {
    this.actualizar((estado) => ({ ...estado, asignacionesCas: this.upsert(estado.asignacionesCas ?? [], asignacion, 'id') }));
  }

  eliminarAsignacionCas(id: string): void {
    this.actualizar((estado) => ({ ...estado, asignacionesCas: (estado.asignacionesCas ?? []).filter((item) => item.id !== id) }));
  }

  guardarAsignacionResponsabilidad(asignacion: AsignacionResponsabilidadLocal): void {
    if ((asignacion.responsabilidad === 'Profesor CAS' || asignacion.responsabilidad === 'Profesor Guía') && !asignacion.seccion) return;
    this.actualizar((estado) => {
      let asignaciones = [...(estado.asignacionesResponsabilidad ?? [])];
      if (asignacion.responsabilidad === 'Profesor CAS' || asignacion.responsabilidad === 'Profesor Coordinador de CAS') {
        asignaciones = asignaciones.filter((item) => item.cedula !== asignacion.cedula || (item.responsabilidad !== 'Profesor CAS' && item.responsabilidad !== 'Profesor Coordinador de CAS'));
      }
      if (asignacion.responsabilidad === 'Profesor Guía' && asignacion.seccion) {
        asignaciones = asignaciones.filter((item) => item.responsabilidad !== 'Profesor Guía' || item.seccion !== asignacion.seccion || item.id === asignacion.id);
      }
      asignaciones = asignaciones.filter((item) => item.id !== asignacion.id);
      asignaciones.push(structuredClone(asignacion));
      const rolesCas = { ...(estado.rolesCas ?? {}) };
      if (asignacion.responsabilidad === 'Profesor CAS' || asignacion.responsabilidad === 'Profesor Coordinador de CAS') rolesCas[asignacion.cedula] = asignacion.responsabilidad;
      return { ...estado, rolesCas, asignacionesResponsabilidad: asignaciones };
    });
  }

  eliminarAsignacionResponsabilidad(id: string): void {
    this.actualizar((estado) => {
      const asignacion = (estado.asignacionesResponsabilidad ?? []).find((item) => item.id === id);
      const asignacionesResponsabilidad = (estado.asignacionesResponsabilidad ?? []).filter((item) => item.id !== id);
      const rolesCas = { ...(estado.rolesCas ?? {}) };
      if (asignacion && (asignacion.responsabilidad === 'Profesor CAS' || asignacion.responsabilidad === 'Profesor Coordinador de CAS')) delete rolesCas[asignacion.cedula];
      return { ...estado, rolesCas, asignacionesResponsabilidad };
    });
  }

  eliminarAsignacionesDeProfesor(cedula: string): void {
    this.actualizar((estado) => {
      const asignacionesResponsabilidad = (estado.asignacionesResponsabilidad ?? []).filter((item) => item.cedula !== cedula);
      const rolesCas = { ...(estado.rolesCas ?? {}) };
      delete rolesCas[cedula];
      return { ...estado, rolesCas, asignacionesResponsabilidad };
    });
  }

  responsabilidadUnicaDeProfesor(cedula: string): ResponsabilidadProfesor | '' {
    const roles = [...new Set(this.asignacionesResponsabilidad().filter((item) => item.cedula === cedula).map((item) => item.responsabilidad))];
    if (roles.length === 1) return roles[0];
    const rolCas = this.rolCasDeProfesor(cedula);
    return rolCas === 'Sin asignación CAS' ? '' : rolCas;
  }

  seccionesGuiadasPorProfesor(profesor: string): string[] {
    return this.asignacionesResponsabilidad().filter((item) => item.responsabilidad === 'Profesor Guía' && item.profesor === profesor).map((item) => item.seccion ?? '').filter(Boolean);
  }

  seccionCasDeProfesor(cedula: string): string {
    return this.asignacionesResponsabilidad().find((item) => item.cedula === cedula && item.responsabilidad === 'Profesor CAS')?.seccion ?? '';
  }

  monografia(id: string): MonografiaLocal | undefined {
    return this.estado().monografias.find((item) => item.id === id);
  }

  guardarMonografia(monografia: MonografiaLocal): void {
    this.actualizar((estado) => ({ ...estado, monografias: this.upsert(estado.monografias, monografia, 'id') }));
  }

  enviarMonografia(monografiaId: string): void {
    const fecha = new Date().toISOString().slice(0, 10);
    this.actualizar((estado) => ({
      ...estado,
      monografias: estado.monografias.map((item) => item.id === monografiaId ? { ...item, informeEnviado: true, fechaEnvioInforme: fecha } : item),
    }));
  }

  agregarSeguimiento(monografiaId: string, seguimiento: Omit<SeguimientoLocal, 'id'>): void {
    this.actualizar((estado) => ({
      ...estado,
      monografias: estado.monografias.map((item) => item.id === monografiaId ? { ...item, seguimientos: [...item.seguimientos, { ...seguimiento, id: this.nuevoId('SEG') }] } : item),
    }));
  }

  guardarSeguimiento(monografiaId: string, seguimiento: SeguimientoLocal): void {
    this.actualizar((estado) => ({
      ...estado,
      monografias: estado.monografias.map((item) => item.id === monografiaId ? { ...item, seguimientos: this.upsert(item.seguimientos, seguimiento, 'id') } : item),
    }));
  }

  restablecer(): void {
    this.estado.set(structuredClone(ESTADO_INICIAL));
    this.persistir();
  }

  private actualizar(mutacion: (estado: EstadoPortal) => EstadoPortal): void {
    this.estado.update(mutacion);
    this.persistir();
  }

  private cargar(): EstadoPortal {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      const estado = guardado ? JSON.parse(guardado) as EstadoPortal : null;
      return estado?.version === 4 ? this.completarDatosFaltantes({ ...estado, cas: this.normalizarCas(estado.cas ?? structuredClone(CAS_DEMO)) }) : structuredClone(ESTADO_INICIAL);
    } catch {
      return structuredClone(ESTADO_INICIAL);
    }
  }

  private persistir(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.estado()));
    } catch {
    }
  }

  private normalizarCas(estudiantes: CasStudentLocal[]): CasStudentLocal[] {
    return estudiantes.map((student) => ({
      ...student,
      actividades: [...student.actividades, ...(student.id === 'CAS-001' ? CAS_DEMO[0].actividades.slice(student.actividades.length, 4).map((activity) => structuredClone(activity)) : [])].map((activity) => ({
        ...activity,
        resultados: Array.from({ length: 7 }, (_, index) => Boolean(activity.resultados?.[index])),
      })),
    }));
  }

  private completarDatosFaltantes(estado: EstadoPortal): EstadoPortal {
    const usuarios = [
      ...estado.registros.usuarios,
      ...ESTADO_INICIAL.registros.usuarios.filter((demo) => !estado.registros.usuarios.some((user) => user.id === demo.id)),
    ];
    const profesores = estado.registros.profesores.map((item) => {
      const demo = ESTADO_INICIAL.registros.profesores.find((profesor) => profesor.id === item.id) ?? {};
      return Object.fromEntries(Object.entries({ ...demo, ...item }).filter(([key]) => key !== 'estado')) as RegistroPortal;
    });
    const estudiantes = [
      ...estado.registros.estudiantes,
      ...ESTUDIANTES_DEMO.filter((demo) => !estado.registros.estudiantes.some((student) => student.id === demo.id)),
    ];
    const periodos = estado.registros.periodos.map((item) => ({ ...item, yearCiclo: item['yearCiclo'] ?? '2026', fechaInicio: item['fechaInicio'] ?? '2026-02-09', fechaFin: item['fechaFin'] ?? '2026-12-04' }));
    const secciones = estado.registros.secciones.map((item) => ({ ...item, yearCiclo: item['yearCiclo'] ?? '2026' }));
    const asignaturas = estado.registros.asignaturas.map((item) => ({ ...item, codigo: item['codigo'] ?? String(item.id).replace(/^ASG-/, '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() }));
    const periodo = estado.registros.periodos.find((item) => item['estado'] === 'Activo')?.['nombre'] ?? 'Segundo semestre 2026';
    const matriculas = [
      ...estado.registros.matriculas,
      ...ESTUDIANTES_DEMO
        .filter((demo) => !estado.registros.matriculas.some((matricula) => matricula['estudiante'] === demo['nombre'] && matricula['periodo'] === periodo && matricula['estado'] === 'Activa'))
        .map((student, index) => ({ id: `MAT-DEMO-${String(index + 1).padStart(3, '0')}`, estudiante: student['nombre'], seccion: student['seccion'], yearCiclo: '2026', periodo, estado: 'Activa' })),
    ];
    const evaluaciones = estudiantes.map((student, index) => estado.evaluaciones.find((item) => item.estudianteId === student.id) ?? {
      ...EVALUACIONES_DEMO[index % EVALUACIONES_DEMO.length],
      estudianteId: student.id,
    });
    const ausentismo = estudiantes.map((student, index) => estado.ausentismo.find((item) => item.estudianteId === student.id) ?? {
      ...AUSENTISMO_DEMO[index % AUSENTISMO_DEMO.length],
      estudianteId: student.id,
    });
    return { ...estado, registros: { ...estado.registros, usuarios, profesores, estudiantes, periodos, secciones, asignaturas, matriculas }, evaluaciones, ausentismo };
  }

  private upsert<T extends Record<K, string>, K extends keyof T>(items: T[], value: T, key: K): T[] {
    return items.some((item) => item[key] === value[key]) ? items.map((item) => item[key] === value[key] ? value : item) : [...items, value];
  }

  private upsertGrupo<T extends { estudianteId: string; asignatura?: string; seccion?: string; periodo?: string }>(items: T[], value: T): T[] {
    const same = (item: T) => item.estudianteId === value.estudianteId && item.asignatura === value.asignatura && item.seccion === value.seccion && item.periodo === value.periodo;
    return items.some(same) ? items.map((item) => same(item) ? value : item) : [...items, value];
  }

  private entero(value: number): number {
    return Math.max(0, Math.trunc(Number(value) || 0));
  }

  private nuevoId(prefijo: string): string {
    return `${prefijo}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
  }
}
