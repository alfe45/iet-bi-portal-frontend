import { Injectable } from '@angular/core';
import {
  AbsenteeismSummary,
  AppUser,
  DashboardData,
  FeaturePageData,
  FormField,
  GuideSectionData,
  MenuItem,
  MenuSection,
  MonographDetail,
  MonographReport,
  PageAction,
  StudentAcademicDetail,
  StudentOverview,
  SubjectPerformance,
  TableAction,
  UserRole,
} from '../models/prototype.models';

const USERS: AppUser[] = [
  {
    id: 1,
    fullName: 'Administrador General',
    username: 'admin.general',
    password: 'demo123',
    role: 'Administrador',
    email: 'admin@reportes.edu',
    avatar: 'AG',
  },
  {
    id: 2,
    fullName: 'Profesor Carlos',
    username: 'carlos.profesor',
    password: 'demo123',
    role: 'Profesor',
    email: 'carlos@reportes.edu',
    avatar: 'PC',
  },
  {
    id: 3,
    fullName: 'Profesora Ana',
    username: 'ana.guia',
    password: 'demo123',
    role: 'Profesor Guía',
    email: 'ana@reportes.edu',
    avatar: 'PA',
    sectionGuide: '11-1',
  },
  {
    id: 4,
    fullName: 'Profesora Guía de Monografía',
    username: 'coord.monografia',
    password: 'demo123',
    role: 'Profesor Guía de Monografía',
    email: 'monografias@reportes.edu',
    avatar: 'CM',
  },
];

const MENU_BY_ROLE: Record<UserRole, MenuSection[]> = {
  Administrador: [
    { title: 'Inicio', items: [{ label: 'Inicio', path: '/dashboard' }] },
    {
      title: 'Personas',
      items: [
        { label: 'Usuarios', path: '/usuarios' },
        { label: 'Profesores', path: '/profesores' },
        { label: 'Estudiantes', path: '/estudiantes' },
      ],
    },
    {
      title: 'Organización académica',
      items: [
        { label: 'Periodos académicos', path: '/periodos' },
        { label: 'Secciones', path: '/secciones' },
        { label: 'Matrículas', path: '/matriculas' },
      ],
    },
    {
      title: 'Configuración académica',
      items: [
        { label: 'Tipos de escala', path: '/escalas' },
        { label: 'Asignaturas', path: '/asignaturas' },
        { label: 'Asignaciones académicas', path: '/asignaciones' },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        { label: 'Mi perfil', path: '/perfil' },
        { label: 'Cerrar sesión', action: 'logout' },
      ],
    },
  ],
  Profesor: [
    { title: 'Inicio', items: [{ label: 'Inicio', path: '/dashboard' }] },
    {
      title: 'Mi trabajo',
      items: [
        { label: 'Mis estudiantes', path: '/estudiantes' },
        { label: 'Mis secciones', path: '/secciones' },
        { label: 'Mis asignaturas', path: '/asignaturas' },
      ],
    },
    {
      title: 'Registro académico',
      items: [
        { label: 'Evaluaciones', path: '/evaluaciones' },
        { label: 'Ausentismo', path: '/ausentismo' },
      ],
    },
    { title: 'Reportes', items: [{ label: 'Reportes académicos', path: '/reportes' }] },
    {
      title: 'Cuenta',
      items: [
        { label: 'Mi perfil', path: '/perfil' },
        { label: 'Cerrar sesión', action: 'logout' },
      ],
    },
  ],
  'Profesor Guía': [
    { title: 'Inicio', items: [{ label: 'Inicio', path: '/dashboard' }] },
    {
      title: 'Mi trabajo',
      items: [
        { label: 'Mis estudiantes', path: '/estudiantes' },
        { label: 'Mis secciones', path: '/secciones' },
        { label: 'Mis asignaturas', path: '/asignaturas' },
      ],
    },
    {
      title: 'Mi sección guía',
      items: [
        { label: 'Estudiantes de mi sección', path: '/seccion-guia' },
        { label: 'Evaluaciones de mi sección', path: '/seccion-guia' },
        { label: 'Ausentismo de mi sección', path: '/seccion-guia' },
        { label: 'Monografías de mi sección', path: '/seccion-guia' },
      ],
    },
    {
      title: 'Registro académico',
      items: [
        { label: 'Evaluaciones', path: '/evaluaciones' },
        { label: 'Ausentismo', path: '/ausentismo' },
      ],
    },
    {
      title: 'Reportes',
      items: [
        { label: 'Reporte individual', path: '/reportes/individual' },
        { label: 'Reporte consolidado de notas', path: '/reportes/consolidado' },
        { label: 'Reporte general de sección', path: '/reportes/seccion' },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        { label: 'Mi perfil', path: '/perfil' },
        { label: 'Cerrar sesión', action: 'logout' },
      ],
    },
  ],
  'Profesor Guía de Monografía': [
    { title: 'Inicio', items: [{ label: 'Inicio', path: '/dashboard' }] },
    {
      title: 'Mi trabajo',
      items: [
        { label: 'Mis estudiantes', path: '/estudiantes' },
        { label: 'Mis secciones', path: '/secciones' },
        { label: 'Mis asignaturas', path: '/asignaturas' },
      ],
    },
    {
      title: 'Registro académico',
      items: [
        { label: 'Evaluaciones', path: '/evaluaciones' },
        { label: 'Ausentismo', path: '/ausentismo' },
      ],
    },
    {
      title: 'Monografías',
      items: [
        { label: 'Mis estudiantes de monografía', path: '/monografias' },
        { label: 'Reportes', path: '/monografias/reportes' },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        { label: 'Mi perfil', path: '/perfil' },
        { label: 'Cerrar sesión', action: 'logout' },
      ],
    },
  ],
};

const DASHBOARD_BY_ROLE: Record<UserRole, DashboardData> = {
  Administrador: {
    heroTitle: 'Panel de configuración',
    heroText:
      'Administra usuarios y alimenta la información base del sistema académico.',
    cards: [
      { label: 'Usuarios', value: '48', trend: '44 activos', tone: 'primary' },
      { label: 'Profesores', value: '18', trend: '15 activos', tone: 'neutral' },
      { label: 'Estudiantes', value: '326', trend: 'Matrícula actual', tone: 'success' },
      { label: 'Periodos académicos', value: '3', trend: '1 activo', tone: 'neutral' },
      { label: 'Secciones', value: '12', trend: 'Segundo semestre 2026', tone: 'primary' },
      { label: 'Asignaturas', value: '15', trend: 'Catálogo vigente', tone: 'success' },
    ],
    quickActions: [],
    highlights: [],
  },
  Profesor: {
    heroTitle: 'Trabajo docente con secciones y estudiantes',
    heroText:
      'Consulta tus estudiantes, registra evaluaciones y controla tardías, ausencias justificadas e injustificadas.',
    cards: [
      { label: 'Mis secciones', value: '3', trend: '11-1, 11-2 y 12-1', tone: 'primary' },
      { label: 'Mis asignaturas', value: '3', trend: 'Historia, Sociales y Lengua B', tone: 'neutral' },
      { label: 'Estudiantes', value: '87', trend: '15 con observaciones', tone: 'success' },
      { label: 'Evaluaciones pendientes', value: '9', trend: '3 por cerrar hoy', tone: 'danger' },
    ],
    quickActions: ['Registrar evaluación', 'Registrar ausentismo', 'Consultar estudiantes'],
    highlights: ['Consulta académica individual', 'Observaciones por asignatura', 'Reportes individuales'],
  },
  'Profesor Guía': {
    heroTitle: 'Vista integral de la sección guía',
    heroText:
      'Mantén tus funciones docentes y consulta, por estudiante, notas, ausentismo y el reporte de monografía disponible.',
    cards: [
      { label: 'Mi sección guía', value: '11-1', trend: 'Nivel undécimo', tone: 'primary' },
      { label: 'Estudiantes', value: '29', trend: '27 activos', tone: 'success' },
      { label: 'Reportes pendientes', value: '5', trend: 'Revisión quincenal', tone: 'danger' },
      { label: 'Monografías', value: '11', trend: 'Integradas al reporte académico', tone: 'primary' },
    ],
    quickActions: ['Ver sección guía', 'Generar reporte', 'Registrar evaluación'],
    highlights: ['Reporte individual con monografía', 'Consolidado de notas por sección', 'Resumen general de sección'],
  },
  'Profesor Guía de Monografía': {
    heroTitle: 'Reportes de monografía',
    heroText:
      'Acompaña a tus estudiantes asignados y mantén sus reportes de monografía actualizados.',
    cards: [
      { label: 'Monografías activas', value: '22', trend: '5 iniciadas este mes', tone: 'primary' },
      { label: 'Supervisores', value: '14', trend: '2 disponibles para reasignación', tone: 'neutral' },
      { label: 'Reportes pendientes', value: '7', trend: 'Vencen esta semana', tone: 'danger' },
    ],
    quickActions: ['Registrar monografía', 'Asignar supervisor', 'Registrar reporte'],
    highlights: ['Flujo integrado con Profesor Guía', 'Selección de observación más reciente', 'Consulta por supervisor'],
  },
};

const STUDENTS: StudentOverview[] = [
  {
    name: 'Ana López',
    id: '8-734-401',
    email: 'ana.lopez@estudiante.edu',
    section: '11-1',
    level: 'Undécimo',
    monograph: 'Lectura crítica y escritura argumentativa',
  },
  {
    name: 'Juan Mora',
    id: '8-811-109',
    email: 'juan.mora@estudiante.edu',
    section: '11-1',
    level: 'Undécimo',
    monograph: 'Modelos de reciclaje escolar',
  },
  {
    name: 'María Solís',
    id: '8-744-002',
    email: 'maria.solis@estudiante.edu',
    section: '11-1',
    level: 'Undécimo',
    monograph: 'Impacto social de la lectura digital',
  },
  {
    name: 'José Moreno',
    id: '8-922-401',
    email: 'jose.moreno@estudiante.edu',
    section: '12-1',
    level: 'Duodécimo',
    monograph: 'Ética y tecnología en el aula',
  },
];

const STUDENT_DETAILS: Record<string, StudentAcademicDetail> = {
  'Ana López': {
    student: STUDENTS[0],
    guideTeacher: 'Profesora Ana',
    subjects: [
      { subject: 'Matemática', minimumValue: '4', obtainedValue: '6', observations: 'Buen razonamiento y constancia.' },
      { subject: 'Historia', minimumValue: '4', obtainedValue: '5', observations: 'Participa y relaciona hechos con criterio.' },
      { subject: 'Lengua B', minimumValue: '4', obtainedValue: '6', observations: 'Producción escrita consistente.' },
      { subject: 'Estudios Sociales', minimumValue: '70', obtainedValue: '85', observations: 'Dominio adecuado de contenidos.' },
      { subject: 'Teoría del Conocimiento', minimumValue: 'C', obtainedValue: 'B', observations: 'Formula buenas preguntas de investigación.' },
    ],
    absenteeism: { tardies: 1, justifiedAbsences: 0, unjustifiedAbsences: 0 },
    monographReport: {
      period: '2026 | Segundo semestre',
      student: 'Ana López',
      monograph: 'Lectura crítica y escritura argumentativa',
      area: 'Lengua A',
      supervisor: 'Maya Quirós Paniagua',
      observations:
        'Se presenta a las secciones de supervisión con puntualidad. Estamos redactando la pregunta para iniciar con la introducción de la monografía, es un estudiante muy aplicado y responsable.',
    },
  },
  'Juan Mora': {
    student: STUDENTS[1],
    guideTeacher: 'Profesora Ana',
    subjects: [
      { subject: 'Matemática', minimumValue: '4', obtainedValue: '4', observations: 'Debe reforzar resolución de ejercicios.' },
      { subject: 'Historia', minimumValue: '4', obtainedValue: '6', observations: 'Buen análisis de fuentes.' },
      { subject: 'Lengua B', minimumValue: '4', obtainedValue: '5', observations: 'Mantiene progreso constante.' },
      { subject: 'Estudios Sociales', minimumValue: '70', obtainedValue: '90', observations: 'Muy buen desempeño investigativo.' },
      { subject: 'Teoría del Conocimiento', minimumValue: 'C', obtainedValue: 'C', observations: 'Necesita profundizar argumentación.' },
    ],
    absenteeism: { tardies: 2, justifiedAbsences: 1, unjustifiedAbsences: 0 },
    monographReport: {
      period: '2026 | Segundo semestre',
      student: 'Juan Mora',
      monograph: 'Modelos de reciclaje escolar',
      area: 'Estudios Sociales',
      supervisor: 'Profesor Carlos',
      observations: 'Se validó el instrumento de observación con la muestra piloto.',
    },
  },
  'María Solís': {
    student: STUDENTS[2],
    guideTeacher: 'Profesora Ana',
    subjects: [
      { subject: 'Matemática', minimumValue: '4', obtainedValue: '7', observations: 'Excelente precisión en resultados.' },
      { subject: 'Historia', minimumValue: '4', obtainedValue: '6', observations: 'Integra bien procesos y contexto.' },
      { subject: 'Lengua B', minimumValue: '4', obtainedValue: '7', observations: 'Comunicación oral y escrita sobresaliente.' },
      { subject: 'Estudios Sociales', minimumValue: '70', obtainedValue: '95', observations: 'Dominio integral del contenido.' },
      { subject: 'Teoría del Conocimiento', minimumValue: 'C', obtainedValue: 'A', observations: 'Investigación muy bien estructurada.' },
    ],
    absenteeism: { tardies: 0, justifiedAbsences: 0, unjustifiedAbsences: 0 },
    monographReport: {
      period: '2026 | Segundo semestre',
      student: 'María Solís',
      monograph: 'Impacto social de la lectura digital',
      area: 'Teoría del Conocimiento',
      supervisor: 'Profesora Ana',
      observations: 'Agregar más antecedentes bibliográficos y precisar variables.',
    },
  },
  'José Moreno': {
    student: STUDENTS[3],
    guideTeacher: 'Luis Poveda',
    subjects: [
      { subject: 'Matemática', minimumValue: '4', obtainedValue: '5', observations: 'Progreso adecuado.' },
      { subject: 'Historia', minimumValue: '4', obtainedValue: '5', observations: 'Buen seguimiento.' },
      { subject: 'Lengua B', minimumValue: '4', obtainedValue: '4', observations: 'Necesita apoyo en redacción.' },
      { subject: 'Estudios Sociales', minimumValue: '70', obtainedValue: '78', observations: 'Cumple con lo esperado.' },
      { subject: 'Teoría del Conocimiento', minimumValue: 'C', obtainedValue: 'C', observations: 'En proceso.' },
    ],
    absenteeism: { tardies: 1, justifiedAbsences: 1, unjustifiedAbsences: 1 },
  },
};

const MONOGRAPHS: MonographDetail[] = [
  {
    id: 'M-301',
    student: 'Ana López',
    title: 'Lectura crítica y escritura argumentativa',
    area: 'Lengua A',
    supervisor: 'Maya Quirós Paniagua',
    status: 'En desarrollo',
    startDate: '2026-08-05',
    description:
      'Monografía enfocada en los procesos de construcción de la pregunta de investigación y la introducción del trabajo escrito.',
    followUps: [
      {
        date: '2026-08-10',
        professor: 'Maya Quirós Paniagua',
        status: 'Revisado',
        note: 'Se presenta a las secciones de supervisión con puntualidad.',
      },
      {
        date: '2026-08-22',
        professor: 'Maya Quirós Paniagua',
        status: 'Revisado',
        note:
          'Se presenta a las secciones de supervisión con puntualidad. Estamos redactando la pregunta para iniciar con la introducción de la monografía, es un estudiante muy aplicado y responsable.',
      },
    ],
  },
  {
    id: 'M-204',
    student: 'Juan Mora',
    title: 'Modelos de reciclaje escolar',
    area: 'Estudios Sociales',
    supervisor: 'Profesor Carlos',
    status: 'Aprobada',
    startDate: '2026-07-18',
    description:
      'Propuesta aplicada para evaluar hábitos de reciclaje y viabilidad de un circuito interno de residuos en la institución.',
    followUps: [
      {
        date: '2026-08-01',
        professor: 'Profesor Carlos',
        status: 'Aprobado',
        note: 'Se validó el instrumento de observación con la muestra piloto.',
      },
    ],
  },
  {
    id: 'M-101',
    student: 'María Solís',
    title: 'Impacto social de la lectura digital',
    area: 'Teoría del Conocimiento',
    supervisor: 'Profesora Ana',
    status: 'En desarrollo',
    startDate: '2026-08-08',
    description:
      'Monografía orientada a medir cómo las prácticas de lectura digital modifican la comprensión y la argumentación crítica del estudiante.',
    followUps: [
      {
        date: '2026-08-12',
        professor: 'Profesora Ana',
        status: 'Revisado',
        note: 'Se definió el problema de investigación y se ajustó el cronograma.',
      },
      {
        date: '2026-08-22',
        professor: 'Profesora Guía de Monografía',
        status: 'Pendiente de ajustes',
        note: 'Agregar más antecedentes bibliográficos y precisar variables.',
      },
    ],
  },
];

function latestFollowUp(monograph: MonographDetail) {
  return monograph.followUps.at(-1);
}

function getStudentDetailByName(name: string) {
  return STUDENT_DETAILS[name];
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function action(label: string, path?: string, tone: PageAction['tone'] = 'ghost'): PageAction {
  return { label, path, tone };
}

function rowAction(label: string, path?: string): TableAction {
  return { label, path };
}

function getStudentBySlug(slug: string) {
  return STUDENTS.find((student) => slugify(student.name) === slug) ?? STUDENTS[0];
}

function getSectionBySlug(slug: string) {
  return ['11-1', '11-2', '12-1'].find((section) => slugify(section) === slug) ?? '11-1';
}

function getEntityLabel(entity: string) {
  const labels: Record<string, string> = {
    usuarios: 'Usuarios',
    profesores: 'Profesores',
    estudiantes: 'Estudiantes',
    periodos: 'Periodos académicos',
    secciones: 'Secciones',
    matriculas: 'Matrículas',
    escalas: 'Tipos de escala',
    asignaturas: 'Asignaturas',
    asignaciones: 'Asignaciones académicas',
    seguimientos: 'Reportes',
  };

  return labels[entity] ?? 'Gestión';
}

function toStudentRow(student: StudentOverview, role: UserRole) {
  const studentSlug = slugify(student.name);
  const actions =
    role === 'Administrador'
      ? [
          rowAction('Ver', `/estudiantes/${studentSlug}`),
          rowAction('Editar', `/estudiantes/${studentSlug}/editar`),
          rowAction('Historial de matrícula', `/estudiantes/${studentSlug}/historial-matricula`),
        ]
      : role === 'Profesor Guía de Monografía'
        ? [rowAction('Ver detalle', `/estudiantes/${studentSlug}`), rowAction('Ver monografía', `/monografias/${MONOGRAPHS.find((item) => item.student === student.name)?.id ?? ''}`)]
        : [rowAction('Ver detalle', `/estudiantes/${studentSlug}`)];

  return {
    fotografia: { title: student.name, subtitle: student.id },
    nombre: student.name,
    cedula: student.id,
    seccion: student.section,
    correo: student.email,
    estado: 'Activo',
    acciones: actions,
  };
}

@Injectable({ providedIn: 'root' })
export class PrototypeDataService {
  getUsers(): AppUser[] {
    return USERS;
  }

  getUserByRole(role: UserRole): AppUser {
    return USERS.find((user) => user.role === role) ?? USERS[0];
  }

  getMenu(role: UserRole): MenuSection[] {
    return MENU_BY_ROLE[role];
  }

  getBreadcrumbs(path: string, role?: UserRole | null): string[] {
    const normalizedPath = path.split('?')[0];
    const parts = normalizedPath.split('/').filter(Boolean);

    if (parts.length === 0 || parts[0] === 'dashboard') {
      return ['Inicio'];
    }

    const entity = parts[0];
    const roleAwareEntity =
      entity === 'secciones' && role !== 'Administrador'
        ? 'Mis secciones'
        : entity === 'estudiantes' && role !== 'Administrador' && role !== 'Profesor Guía de Monografía'
          ? 'Mis estudiantes'
          : getEntityLabel(entity);
    const crumbs = ['Inicio', roleAwareEntity];

    if (parts[1] === 'registrar') {
      const registerLabels: Record<string, string> = {
        usuarios: 'Registrar usuario',
        profesores: 'Registrar profesor',
        estudiantes: 'Registrar estudiante',
        periodos: 'Registrar periodo académico',
        secciones: 'Registrar sección',
        matriculas: 'Registrar matrícula',
        escalas: 'Registrar tipo de escala',
        asignaturas: 'Registrar asignatura',
        asignaciones: 'Registrar asignación académica',
      };

      return [...crumbs, registerLabels[entity] ?? 'Registrar'];
    }

    if (entity === 'monografias' && parts[1] === 'reportes' && parts[2] === 'nuevo') {
      return ['Inicio', 'Reportes', 'Registrar reporte'];
    }

    if (entity === 'monografias' && parts[1] === 'reportes') {
      return ['Inicio', 'Reportes'];
    }

    if (parts[2] === 'editar') {
      const editLabels: Record<string, string> = {
        usuarios: 'Editar usuario',
        profesores: 'Editar profesor',
        estudiantes: 'Editar estudiante',
        periodos: 'Editar periodo académico',
        secciones: 'Editar sección',
        matriculas: 'Editar matrícula',
        escalas: 'Editar tipo de escala',
        asignaturas: 'Editar asignatura',
        asignaciones: 'Editar asignación académica',
      };

      return [...crumbs, editLabels[entity] ?? 'Editar'];
    }

    if (parts[2] === 'historial-matricula') {
      return [...crumbs, 'Historial de matrícula'];
    }

    if (entity === 'monografias' && parts[1]) {
      return [...crumbs, 'Detalle'];
    }

    if (entity === 'reportes' && parts[1]) {
      const reportLabels: Record<string, string> = {
        individual: 'Reporte individual',
        consolidado: 'Reporte consolidado de notas',
        seccion: 'Reporte general de sección',
        monografia: 'Reporte de monografía',
      };
      return ['Inicio', 'Reportes', reportLabels[parts[1]] ?? 'Detalle'];
    }

    if (parts[1]) {
      if (entity === 'estudiantes') {
        return [...crumbs, getStudentBySlug(parts[1]).name];
      }

      if (entity === 'secciones') {
        return [...crumbs, getSectionBySlug(parts[1])];
      }

      return [...crumbs, 'Detalle'];
    }

    return crumbs;
  }

  getDashboard(role: UserRole): DashboardData {
    return DASHBOARD_BY_ROLE[role];
  }

  getStudentRows(role: UserRole) {
    const scope =
      role === 'Administrador'
        ? STUDENTS
        : role === 'Profesor Guía de Monografía'
          ? STUDENTS.filter((student) => !!getStudentDetailByName(student.name)?.monographReport)
          : STUDENTS.filter((student) => ['11-1', '11-2', '12-1'].includes(student.section));

    return scope.map((student) => toStudentRow(student, role));
  }

  getFeaturePage(path: string, role: UserRole): FeaturePageData {
    const catalog: Record<string, FeaturePageData> = {
      usuarios: {
        title: 'Usuarios',
        subtitle: 'Gestión de accesos, estado operativo y asignación de uno de los cuatro roles existentes.',
        columns: [
          { key: 'usuario', label: 'Nombre de usuario' },
          { key: 'rol', label: 'Rol asignado', type: 'badge' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'profesor', label: 'Profesor asociado' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { usuario: 'admin.general', rol: 'Administrador', estado: 'Activo', profesor: '-', acciones: [rowAction('Ver', '/usuarios/admin-general'), rowAction('Editar', '/usuarios/admin-general/editar')] },
          { usuario: 'carlos.profesor', rol: 'Profesor', estado: 'Activo', profesor: 'Profesor Carlos', acciones: [rowAction('Ver', '/usuarios/carlos-profesor'), rowAction('Editar', '/usuarios/carlos-profesor/editar')] },
          { usuario: 'ana.guia', rol: 'Profesor Guía', estado: 'Activo', profesor: 'Profesora Ana', acciones: [rowAction('Ver', '/usuarios/ana-guia'), rowAction('Editar', '/usuarios/ana-guia/editar')] },
          { usuario: 'guia.monografia', rol: 'Profesor Guía de Monografía', estado: 'Activo', profesor: 'Maya Quirós Paniagua', acciones: [rowAction('Ver', '/usuarios/guia-monografia'), rowAction('Editar', '/usuarios/guia-monografia/editar')] },
        ],
        actions: [action('Registrar usuario', '/usuarios/registrar', 'primary')],
        tableTitle: 'Lista de usuarios',
        tableDescription: 'Consulte las cuentas registradas y utilice las acciones visibles de cada fila.',
        formTitle: 'Formulario de usuario',
        formFields: [
          { key: 'usuario', label: 'Nombre de usuario', type: 'text', value: 'nuevo.usuario', section: 'Acceso al sistema' },
          { key: 'contrasena', label: 'Contraseña', type: 'password', value: '', section: 'Acceso al sistema' },
          { key: 'rol', label: 'Rol', type: 'select', value: 'Profesor', options: ['Administrador', 'Profesor', 'Profesor Guía', 'Profesor Guía de Monografía'], section: 'Permisos y relación' },
          { key: 'profesor', label: 'Profesor asociado', type: 'select', value: 'Profesor Carlos', options: ['Ninguno', 'Profesor Carlos', 'Profesora Ana', 'Maya Quirós Paniagua'], section: 'Permisos y relación' },
          { key: 'estado', label: 'Estado', type: 'select', value: 'Activo', options: ['Activo', 'Inactivo'], section: 'Estado de la cuenta' },
        ],
        modalTitle: 'Consulta de usuario',
        modalDescription: 'Detalle rápido del usuario, rol asignado y profesor asociado cuando aplica.',
        confirmationTitle: 'Cambiar estado de usuario',
        confirmationDescription: 'Confirme el cambio antes de activar o desactivar la cuenta.',
      },
      profesores: {
        title: 'Profesores',
        subtitle:
          role === 'Profesor Guía de Monografía'
            ? 'Consulta profesores para asignación o cambio de supervisor en monografías.'
            : 'Administra el registro de profesores y su usuario asociado. El rol del sistema se asigna desde Usuarios.',
        alert:
          role === 'Profesor Guía de Monografía'
            ? 'Vista orientada a consulta y selección de supervisor.'
            : 'El Administrador registra, consulta y modifica profesores.',
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'cedula', label: 'Cédula' },
          { key: 'correo', label: 'Correo' },
          { key: 'usuario', label: 'Usuario asociado' },
          { key: 'rol', label: 'Rol', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { nombre: 'Profesor Carlos', cedula: '4-713-992', correo: 'carlos@reportes.edu', usuario: 'carlos.profesor', rol: 'Profesor', acciones: [rowAction('Ver', `/profesores/${slugify('Profesor Carlos')}`), rowAction('Editar', `/profesores/${slugify('Profesor Carlos')}/editar`)] },
          { nombre: 'Profesora Ana', cedula: '8-555-101', correo: 'ana@reportes.edu', usuario: 'ana.guia', rol: 'Profesor Guía', acciones: [rowAction('Ver', `/profesores/${slugify('Profesora Ana')}`), rowAction('Editar', `/profesores/${slugify('Profesora Ana')}/editar`)] },
          { nombre: 'Maya Quirós Paniagua', cedula: '8-432-773', correo: 'maya@reportes.edu', usuario: 'maya.supervisora', rol: 'Profesor Guía de Monografía', acciones: [rowAction('Ver', `/profesores/${slugify('Maya Quirós Paniagua')}`), rowAction('Editar', `/profesores/${slugify('Maya Quirós Paniagua')}/editar`)] },
        ],
        actions: role === 'Administrador' ? [action('Registrar profesor', '/profesores/registrar', 'primary')] : [],
        tableTitle: 'Lista de profesores',
        formTitle: 'Formulario de profesor',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: 'Nuevo profesor' },
          { key: 'cedula', label: 'Cédula', type: 'text', value: '8-000-000' },
          { key: 'correo', label: 'Correo', type: 'text', value: 'profesor@reportes.edu' },
          { key: 'usuario', label: 'Usuario asociado', type: 'select', value: 'nuevo.usuario', options: ['nuevo.usuario', 'carlos.profesor', 'ana.guia'] },
        ],
        modalTitle: 'Ficha docente',
        modalDescription: 'Resumen de asignaturas, secciones y supervisiones activas del profesor.',
        confirmationTitle: 'Actualizar profesor',
        confirmationDescription:
          role === 'Profesor Guía de Monografía'
            ? 'Confirma la asignación o cambio del profesor supervisor para la monografía seleccionada.'
            : 'Confirme el cambio antes de guardar modificaciones en el registro docente.',
      },
      estudiantes: {
        title: role === 'Profesor' ? 'Mis estudiantes' : role === 'Profesor Guía' ? 'Mis estudiantes' : 'Estudiantes',
        subtitle:
          role === 'Administrador'
            ? 'Consulte el registro institucional de estudiantes y acceda a cada proceso desde una pantalla independiente.'
            : role === 'Profesor Guía de Monografía'
              ? 'Consulta de estudiantes con información relevante para monografías y reportes.'
              : 'Consulta de estudiantes vinculados con tus secciones y carga académica.',
        alert:
          role === 'Administrador'
            ? 'Incluye registro, edición y consulta del estudiante.'
            : role === 'Profesor Guía'
              ? 'Desde esta vista y desde Mi sección guía puedes consultar el reporte de monografía disponible.'
              : 'Vista orientada a consulta del desempeño académico del estudiante.',
        filters: role === 'Administrador' ? [{ label: 'Sección', value: '11-1', options: ['11-1', '11-2', '12-1'] }, { label: 'Estado', value: 'Activo', options: ['Activo', 'Inactivo'] }] : [{ label: 'Sección', value: '11-1', options: ['11-1', '11-2', '12-1'] }],
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'cedula', label: 'Cédula' },
          { key: 'seccion', label: 'Sección' },
          { key: 'correo', label: 'Correo' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: this.getStudentRows(role),
        actions: role === 'Administrador' ? [action('Registrar estudiante', '/estudiantes/registrar', 'primary')] : [],
        tableTitle: role === 'Administrador' ? 'Estudiantes' : 'Listado de estudiantes',
        formTitle: 'Formulario de estudiante',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: 'Andrea', section: 'Datos personales' },
          { key: 'apellido1', label: 'Primer apellido', type: 'text', value: 'Castillo', section: 'Datos personales' },
          { key: 'apellido2', label: 'Segundo apellido', type: 'text', value: 'Mora', section: 'Datos personales' },
          { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', value: '2009-04-21', section: 'Datos personales' },
          { key: 'cedula', label: 'Cédula', type: 'text', value: '8-123-456', section: 'Identificación' },
          { key: 'correo', label: 'Correo', type: 'text', value: 'andrea.castillo@estudiante.edu', section: 'Contacto' },
          { key: 'celular', label: 'Celular', type: 'text', value: '8888-1234', section: 'Contacto' },
          { key: 'fotografia', label: 'Fotografía', type: 'text', value: 'andrea-castillo.jpg', section: 'Expediente' },
        ],
        modalTitle: 'Detalle del estudiante',
        modalDescription: 'Consulta de datos generales, historial académico, ausentismo y monografía cuando aplique.',
        confirmationTitle: 'Actualizar estudiante',
        confirmationDescription: 'Confirmación visual antes de guardar cambios del expediente estudiantil.',
      },
      periodos: {
        title: 'Periodos académicos',
        subtitle:
          role === 'Administrador'
            ? 'Registro, consulta, modificación y cambio de estado de periodos académicos.'
            : 'Consulta y selección de periodos disponibles para operación académica y reportes.',
        columns: [
          { key: 'anio', label: 'Año' },
          { key: 'semestre', label: 'Semestre' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { anio: '2026', semestre: 'Primer semestre', estado: 'Cerrado', acciones: [rowAction('Ver', '/periodos/2026-primer-semestre')] },
          { anio: '2026', semestre: 'Segundo semestre', estado: 'Activo', acciones: role === 'Administrador' ? [rowAction('Ver', '/periodos/2026-segundo-semestre'), rowAction('Editar', '/periodos/2026-segundo-semestre/editar')] : [rowAction('Ver detalle', '/periodos/2026-segundo-semestre')] },
          { anio: '2027', semestre: 'Primer semestre', estado: 'Planificado', acciones: role === 'Administrador' ? [rowAction('Ver', '/periodos/2027-primer-semestre'), rowAction('Editar', '/periodos/2027-primer-semestre/editar')] : [rowAction('Ver detalle', '/periodos/2027-primer-semestre')] },
        ],
        actions: role === 'Administrador' ? [action('Registrar periodo académico', '/periodos/registrar', 'primary')] : [],
        tableTitle: 'Lista de periodos académicos',
        formTitle: 'Formulario de periodo académico',
        formFields: [
          { key: 'anio', label: 'Año', type: 'text', value: '2027' },
          { key: 'semestre', label: 'Semestre', type: 'select', value: 'Primer semestre', options: ['Primer semestre', 'Segundo semestre'] },
          { key: 'estado', label: 'Estado', type: 'select', value: 'Planificado', options: ['Planificado', 'Activo', 'Cerrado'] },
        ],
        modalTitle: 'Detalle del periodo',
        modalDescription: 'Incluye estado, vigencia y disponibilidad para evaluaciones, matrículas y reportes.',
        confirmationTitle: 'Cambiar estado del periodo',
        confirmationDescription: 'Se muestra la confirmación previa al cambio de estado del periodo académico.',
      },
      secciones: {
        title: role === 'Administrador' ? 'Secciones académicas' : 'Mis secciones',
        subtitle:
          role === 'Administrador'
            ? 'Registro, consulta, modificación y asignación de profesor guía.'
            : 'Consulta de las secciones relacionadas con tu carga académica. La información se muestra solo en modo lectura.',
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'nivel', label: 'Nivel' },
          { key: 'periodo', label: 'Periodo académico' },
          { key: 'guia', label: 'Profesor guía' },
          { key: 'estudiantes', label: 'Cantidad de estudiantes' },
          { key: 'asignatura', label: 'Asignatura que imparte' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { nombre: '11-1', nivel: 'Undécimo', periodo: '2026 | Segundo semestre', guia: 'Profesora Ana', estudiantes: '29', asignatura: role === 'Administrador' ? 'Historia' : 'Historia', acciones: role === 'Administrador' ? [rowAction('Ver', '/secciones/11-1'), rowAction('Editar', '/secciones/11-1/editar')] : [rowAction('Ver estudiantes', '/secciones/11-1')] },
          { nombre: '11-2', nivel: 'Undécimo', periodo: '2026 | Segundo semestre', guia: 'Rosa Mendoza', estudiantes: '28', asignatura: role === 'Administrador' ? 'Lengua B' : 'Estudios Sociales', acciones: role === 'Administrador' ? [rowAction('Ver', '/secciones/11-2'), rowAction('Editar', '/secciones/11-2/editar')] : [rowAction('Ver estudiantes', '/secciones/11-2')] },
          { nombre: '12-1', nivel: 'Duodécimo', periodo: '2026 | Segundo semestre', guia: 'Luis Poveda', estudiantes: '30', asignatura: role === 'Administrador' ? 'Matemática' : 'Lengua B', acciones: role === 'Administrador' ? [rowAction('Ver', '/secciones/12-1'), rowAction('Editar', '/secciones/12-1/editar')] : [rowAction('Ver estudiantes', '/secciones/12-1')] },
        ],
        actions: role === 'Administrador' ? [action('Registrar sección', '/secciones/registrar', 'primary')] : [],
        tableTitle: role === 'Administrador' ? 'Lista de secciones' : 'Mis secciones',
        formTitle: 'Formulario de sección',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: '12-2' },
          { key: 'nivel', label: 'Nivel', type: 'select', value: 'Duodécimo', options: ['Undécimo', 'Duodécimo'] },
          { key: 'periodo', label: 'Periodo académico', type: 'select', value: '2026 | Segundo semestre', options: ['2026 | Segundo semestre', '2027 | Primer semestre'] },
          { key: 'guia', label: 'Profesor guía', type: 'select', value: 'Profesora Ana', options: ['Profesora Ana', 'Profesor Carlos', 'Maya Quirós Paniagua'] },
        ],
        modalTitle: 'Consulta de sección',
        modalDescription: 'Resume nivel, estudiantes matriculados y profesor guía asignado.',
        confirmationTitle: 'Asignar profesor guía',
        confirmationDescription: 'Confirme el cambio del guía responsable antes de guardar.',
      },
      matriculas: {
        title: 'Matrículas',
        subtitle: 'Asociación de estudiantes con secciones, periodos y estado de matrícula.',
        columns: [
          { key: 'estudiante', label: 'Estudiante' },
          { key: 'seccion', label: 'Sección' },
          { key: 'periodo', label: 'Periodo' },
          { key: 'fecha', label: 'Fecha' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { estudiante: 'Ana López', seccion: '11-1', periodo: '2026 | Segundo semestre', fecha: '2026-08-01', estado: 'Activa', acciones: [rowAction('Ver', '/matriculas/ana-lopez-11-1'), rowAction('Editar', '/matriculas/ana-lopez-11-1/editar')] },
          { estudiante: 'Juan Mora', seccion: '11-1', periodo: '2026 | Segundo semestre', fecha: '2026-08-01', estado: 'Activa', acciones: [rowAction('Ver', '/matriculas/juan-mora-11-1'), rowAction('Editar', '/matriculas/juan-mora-11-1/editar')] },
          { estudiante: 'María Solís', seccion: '11-1', periodo: '2026 | Segundo semestre', fecha: '2026-08-02', estado: 'Activa', acciones: [rowAction('Ver', '/matriculas/maria-solis-11-1')] },
        ],
        actions: [action('Registrar matrícula', '/matriculas/registrar', 'primary')],
        tableTitle: 'Lista de matrículas',
        formTitle: 'Formulario de matrícula',
        formFields: [
          { key: 'estudiante', label: 'Estudiante', type: 'select', value: 'Ana López', options: ['Ana López', 'Juan Mora', 'María Solís'], section: 'Selección principal' },
          { key: 'seccion', label: 'Sección', type: 'select', value: '11-1', options: ['11-1', '11-2', '12-1'], section: 'Selección principal' },
          { key: 'periodo', label: 'Periodo', type: 'select', value: '2026 | Segundo semestre', options: ['2026 | Segundo semestre'], section: 'Periodo y estado' },
          { key: 'fecha', label: 'Fecha', type: 'date', value: '2026-08-01', section: 'Periodo y estado' },
          { key: 'estado', label: 'Estado', type: 'select', value: 'Activa', options: ['Activa', 'Retirada'], section: 'Periodo y estado' },
        ],
        modalTitle: 'Historial de matrícula',
        modalDescription: 'Muestra periodo, sección y nivel del estudiante en sus matrículas registradas.',
        confirmationTitle: 'Guardar matrícula',
        confirmationDescription: 'Confirma la relación entre estudiante, sección y periodo.',
      },
      escalas: {
        title: 'Tipos de escala',
        subtitle: 'Catálogo de escalas utilizadas en asignaturas y evaluaciones.',
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'rango', label: 'Ejemplo' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { nombre: 'Escala 1 a 7', rango: '1-7', estado: 'Activa', acciones: [rowAction('Ver', '/escalas/escala-1-a-7'), rowAction('Editar', '/escalas/escala-1-a-7/editar')] },
          { nombre: 'Escala 1 a 100', rango: '1-100', estado: 'Activa', acciones: [rowAction('Ver', '/escalas/escala-1-a-100'), rowAction('Editar', '/escalas/escala-1-a-100/editar')] },
          { nombre: 'Escala A a E', rango: 'A-E', estado: 'Activa', acciones: [rowAction('Ver', '/escalas/escala-a-a-e'), rowAction('Editar', '/escalas/escala-a-a-e/editar')] },
        ],
        actions: [],
        formTitle: 'Formulario de escala',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: 'Escala cualitativa' },
          { key: 'rango', label: 'Rango', type: 'text', value: 'A-E' },
        ],
        modalTitle: 'Detalle de escala',
        modalDescription: 'Resume el formato de nota y su disponibilidad para asignaturas.',
        confirmationTitle: 'Actualizar escala',
        confirmationDescription: 'Confirma la modificación del tipo de escala seleccionado.',
      },
      asignaturas: {
        title: role === 'Administrador' ? 'Asignaturas' : 'Mis asignaturas',
        subtitle:
          role === 'Administrador'
            ? 'Catálogo institucional de asignaturas y tipo de escala asociado.'
            : 'Consulta de las asignaturas relacionadas con tu carga o sección guía.',
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'descripcion', label: 'Descripción' },
          { key: 'escala', label: 'Tipo de escala' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { nombre: 'Historia', descripcion: 'Procesos históricos contemporáneos', escala: '1-7', acciones: role === 'Administrador' ? [rowAction('Ver', '/asignaturas/historia'), rowAction('Editar', '/asignaturas/historia/editar')] : [rowAction('Ver detalle', '/asignaturas/historia')] },
          { nombre: 'Matemática', descripcion: 'Resolución de problemas y pensamiento lógico', escala: '1-100', acciones: role === 'Administrador' ? [rowAction('Ver', '/asignaturas/matematica'), rowAction('Editar', '/asignaturas/matematica/editar')] : [rowAction('Ver detalle', '/asignaturas/matematica')] },
          { nombre: 'Estudios Sociales', descripcion: 'Análisis de contexto social y ciudadanía', escala: '1-100', acciones: role === 'Administrador' ? [rowAction('Ver', '/asignaturas/estudios-sociales'), rowAction('Editar', '/asignaturas/estudios-sociales/editar')] : [rowAction('Ver detalle', '/asignaturas/estudios-sociales')] },
          { nombre: 'Lengua B', descripcion: 'Competencias comunicativas y producción escrita', escala: '1-7', acciones: role === 'Administrador' ? [rowAction('Ver', '/asignaturas/lengua-b'), rowAction('Editar', '/asignaturas/lengua-b/editar')] : [rowAction('Ver detalle', '/asignaturas/lengua-b')] },
          { nombre: 'Teoría del Conocimiento', descripcion: 'Investigación y pensamiento crítico', escala: 'A-E', acciones: role === 'Administrador' ? [rowAction('Ver', '/asignaturas/teoria-del-conocimiento'), rowAction('Editar', '/asignaturas/teoria-del-conocimiento/editar')] : [rowAction('Ver detalle', '/asignaturas/teoria-del-conocimiento')] },
        ],
        actions: role === 'Administrador' ? [action('Registrar asignatura', '/asignaturas/registrar', 'primary')] : [],
        tableTitle: role === 'Administrador' ? 'Lista de asignaturas' : 'Mis asignaturas',
        formTitle: 'Formulario de asignatura',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: 'Biología' },
          { key: 'descripcion', label: 'Descripción', type: 'textarea', value: 'Ciencias naturales con enfoque en laboratorio.' },
          { key: 'escala', label: 'Tipo de escala', type: 'select', value: '1-100', options: ['1-7', '1-100', 'A-E'] },
        ],
        modalTitle: 'Detalle de asignatura',
        modalDescription: 'Consulta rápida de descripción, escala y secciones relacionadas.',
        confirmationTitle: 'Actualizar asignatura',
        confirmationDescription: 'Confirme los cambios antes de aplicarlos en el catálogo.',
      },
      asignaciones: {
        title: 'Asignaciones académicas',
        subtitle: 'Relación entre profesor, asignatura y sección para el periodo activo.',
        columns: [
          { key: 'profesor', label: 'Profesor' },
          { key: 'asignatura', label: 'Asignatura' },
          { key: 'seccion', label: 'Sección' },
          { key: 'periodo', label: 'Periodo' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: [
          { profesor: 'Profesor Carlos', asignatura: 'Historia', seccion: '11-1', periodo: '2026 | Segundo semestre', acciones: [rowAction('Ver', '/asignaciones/carlos-historia-11-1'), rowAction('Editar', '/asignaciones/carlos-historia-11-1/editar')] },
          { profesor: 'Profesor Carlos', asignatura: 'Estudios Sociales', seccion: '11-1', periodo: '2026 | Segundo semestre', acciones: [rowAction('Ver', '/asignaciones/carlos-sociales-11-1'), rowAction('Editar', '/asignaciones/carlos-sociales-11-1/editar')] },
          { profesor: 'Profesora Ana', asignatura: 'Teoría del Conocimiento', seccion: '11-1', periodo: '2026 | Segundo semestre', acciones: [rowAction('Ver', '/asignaciones/ana-tdc-11-1'), rowAction('Editar', '/asignaciones/ana-tdc-11-1/editar')] },
        ],
        actions: [action('Registrar asignación académica', '/asignaciones/registrar', 'primary')],
        tableTitle: 'Lista de asignaciones académicas',
        formTitle: 'Formulario de asignación académica',
        formFields: [
          { key: 'profesor', label: 'Profesor', type: 'select', value: 'Profesor Carlos', options: ['Profesor Carlos', 'Profesora Ana', 'Maya Quirós Paniagua'] },
          { key: 'asignatura', label: 'Asignatura', type: 'select', value: 'Historia', options: ['Historia', 'Matemática', 'Estudios Sociales', 'Lengua B', 'Teoría del Conocimiento'] },
          { key: 'seccion', label: 'Sección', type: 'select', value: '11-1', options: ['11-1', '11-2', '12-1'] },
        ],
        modalTitle: 'Detalle de asignación',
        modalDescription: 'Resumen de la carga académica y relación entre docente, materia y sección.',
        confirmationTitle: 'Guardar asignación',
        confirmationDescription: 'Confirma la creación o modificación de la asignación académica.',
      },
      monografias: {
        title: 'Monografías',
        subtitle:
          role === 'Profesor Guía'
            ? 'Consulta de monografías y reportes de los estudiantes de tu sección guía.'
            : 'Gestiona únicamente las monografías de los estudiantes que tienes asignados.',
        columns: [
          { key: 'estudiante', label: 'Estudiante' },
          { key: 'titulo', label: 'Título' },
          { key: 'area', label: 'Área' },
          { key: 'supervisor', label: 'Supervisor' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'reporte', label: 'Reporte generado', type: 'badge' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: MONOGRAPHS
          .filter((item) => role === 'Profesor Guía' ? item.student !== 'José Moreno' : true)
          .map((item) => ({
            estudiante: item.student,
            titulo: item.title,
            area: item.area,
            supervisor: item.supervisor,
            estado: item.status,
            reporte: 'Disponible',
            acciones: role === 'Profesor Guía de Monografía' ? [rowAction('Ver monografía', `/monografias/${item.id}`), rowAction('Registrar reporte', '/monografias/reportes/nuevo')] : [rowAction('Ver reporte', `/monografias/${item.id}`)],
          })),
        actions: role === 'Profesor Guía de Monografía' ? [action('Registrar monografía', undefined, 'primary')] : [],
        formTitle: 'Formulario de monografía',
        formFields: [
          { key: 'estudiante', label: 'Estudiante', type: 'select', value: 'Ana López', options: ['Ana López', 'Juan Mora', 'María Solís'], section: 'Asignación principal' },
          { key: 'area', label: 'Asignatura o área', type: 'select', value: 'Lengua A', options: ['Lengua A', 'Historia', 'Estudios Sociales', 'Teoría del Conocimiento'], section: 'Asignación principal' },
          { key: 'titulo', label: 'Título', type: 'text', value: 'Lectura crítica y escritura argumentativa', section: 'Contenido de la monografía' },
          { key: 'descripcion', label: 'Descripción', type: 'textarea', value: 'Resumen del problema, alcance, objetivos y metodología.', section: 'Contenido de la monografía' },
          { key: 'supervisor', label: 'Supervisor', type: 'select', value: 'Maya Quirós Paniagua', options: ['Maya Quirós Paniagua', 'Profesora Ana', 'Profesor Carlos'], section: 'Reporte' },
          { key: 'estado', label: 'Estado', type: 'select', value: 'En desarrollo', options: ['En desarrollo', 'Aprobada', 'Pendiente'], section: 'Reporte' },
          { key: 'fecha', label: 'Fecha de inicio', type: 'date', value: '2026-08-05', section: 'Reporte' },
        ],
        modalTitle: 'Vista previa de monografía',
        modalDescription: 'Consulta rápida del estudiante, supervisor, estado y disponibilidad del reporte de monografía.',
        confirmationTitle: 'Guardar monografía',
        confirmationDescription: 'Confirma la creación o actualización del registro de monografía.',
      },
      seguimientos: {
        title: 'Reportes de monografía',
        subtitle: 'Registro, consulta y modificación de observaciones y estados sobre el avance de cada monografía.',
        columns: [
          { key: 'fecha', label: 'Fecha' },
          { key: 'profesor', label: 'Profesor' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'observacion', label: 'Observación' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: MONOGRAPHS.flatMap((item) =>
          item.followUps.map((followUp) => ({
            fecha: followUp.date,
            profesor: followUp.professor,
            estado: followUp.status,
            observacion: `${item.student}: ${followUp.note}`,
            acciones: ['Consultar', 'Modificar'],
          })),
        ),
        actions: ['Registrar reporte', 'Consultar reporte', 'Modificar reporte'],
        formTitle: 'Formulario de reporte',
        formFields: [
          { key: 'fecha', label: 'Fecha', type: 'date', value: '2026-08-25' },
          { key: 'estado', label: 'Estado', type: 'select', value: 'Revisado', options: ['Revisado', 'Pendiente', 'Aprobado'] },
          { key: 'observacion', label: 'Observación', type: 'textarea', value: 'Se revisó la pregunta de investigación y se consolidó la observación final del reporte.' },
        ],
        modalTitle: 'Detalle del reporte',
        modalDescription: 'Incluye fecha, observación, estado y disponibilidad para el reporte de monografía.',
        confirmationTitle: 'Guardar reporte',
        confirmationDescription: 'Confirma la actualización del reporte.',
      },
      supervisores: {
        title: 'Consulta por supervisor',
        subtitle: 'Selecciona un profesor y revisa estudiantes, monografías, estado y último reporte.',
        columns: [
          { key: 'profesor', label: 'Profesor' },
          { key: 'estudiante', label: 'Estudiante' },
          { key: 'monografia', label: 'Monografía' },
          { key: 'estado', label: 'Estado', type: 'badge' },
          { key: 'seguimiento', label: 'Último reporte' },
          { key: 'acciones', label: 'Acciones', type: 'actions' },
        ],
        rows: MONOGRAPHS.map((item) => ({
          profesor: item.supervisor,
          estudiante: item.student,
          monografia: item.title,
          estado: item.status,
          seguimiento: latestFollowUp(item)?.note ?? 'Sin reportes',
          acciones: ['Asignar supervisor', 'Cambiar supervisor'],
        })),
        actions: ['Asignar supervisor', 'Cambiar supervisor'],
        formTitle: 'Asignación de supervisor',
        formFields: [
          { key: 'estudiante', label: 'Estudiante', type: 'select', value: 'Ana López', options: ['Ana López', 'Juan Mora', 'María Solís'] },
          { key: 'monografia', label: 'Monografía', type: 'select', value: 'Lectura crítica y escritura argumentativa', options: ['Lectura crítica y escritura argumentativa', 'Modelos de reciclaje escolar', 'Impacto social de la lectura digital'] },
          { key: 'actual', label: 'Supervisor actual', type: 'select', value: 'Maya Quirós Paniagua', options: ['Maya Quirós Paniagua', 'Profesora Ana', 'Profesor Carlos'] },
          { key: 'nuevo', label: 'Nuevo supervisor', type: 'select', value: 'Profesora Ana', options: ['Maya Quirós Paniagua', 'Profesora Ana', 'Profesor Carlos'] },
        ],
        modalTitle: 'Cambio de supervisor',
        modalDescription: 'Vista previa del profesor actual y del nuevo supervisor propuesto para la monografía.',
        confirmationTitle: 'Confirmar supervisor',
        confirmationDescription: 'El sistema solicita confirmación antes de guardar la reasignación.',
      },
    };

    return catalog[path];
  }

  getRecordPage(entity: string, mode: 'create' | 'detail' | 'edit' | 'history', role: UserRole, id: string): FeaturePageData {
    const base = this.getFeaturePage(entity, role);
    const student = getStudentBySlug(id);
    const section = getSectionBySlug(id);
    const studentDetail = getStudentDetailByName(student.name);
    const sectionStudents = STUDENTS.filter((item) => item.section === section);

    if (entity === 'estudiantes') {
      if (mode === 'create') {
        return {
          ...base,
          title: 'Registrar estudiante',
          subtitle: 'Complete la información principal del estudiante en un formulario independiente.',
          actions: [action('Cancelar', '/estudiantes')],
          formTitle: 'Registrar estudiante',
          formSubmitLabel: 'Guardar estudiante',
        };
      }

      if (mode === 'edit') {
        return {
          ...base,
          title: 'Editar estudiante',
          subtitle: `Actualice la información del expediente de ${student.name}.`,
          actions: [action('Cancelar', '/estudiantes')],
          formTitle: 'Editar estudiante',
          formFields: [
            { key: 'nombre', label: 'Nombre', type: 'text', value: student.name.split(' ')[0], section: 'Datos personales' },
            { key: 'apellido1', label: 'Primer apellido', type: 'text', value: student.name.split(' ')[1] ?? '', section: 'Datos personales' },
            { key: 'apellido2', label: 'Segundo apellido', type: 'text', value: 'Pérez', section: 'Datos personales' },
            { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', value: '2009-04-21', section: 'Datos personales' },
            { key: 'cedula', label: 'Cédula', type: 'text', value: student.id, section: 'Identificación' },
            { key: 'correo', label: 'Correo', type: 'text', value: student.email, section: 'Contacto' },
            { key: 'celular', label: 'Celular', type: 'text', value: '8888-1234', section: 'Contacto' },
            { key: 'fotografia', label: 'Fotografía', type: 'text', value: `${slugify(student.name)}.jpg`, section: 'Expediente' },
          ],
          formSubmitLabel: 'Guardar cambios',
        };
      }

      if (mode === 'history') {
        return {
          ...base,
          title: 'Historial de matrícula',
          subtitle: `Consulte el historial de matrícula de ${student.name}.`,
          actions: [],
          formTitle: 'Datos del estudiante',
          formFields: [
            { key: 'nombre', label: 'Nombre', type: 'text', value: student.name, section: 'Referencia' },
            { key: 'cedula', label: 'Cédula', type: 'text', value: student.id, section: 'Referencia' },
            { key: 'correo', label: 'Correo', type: 'text', value: student.email, section: 'Referencia' },
          ],
          readOnly: true,
          columns: [
            { key: 'periodo', label: 'Periodo' },
            { key: 'seccion', label: 'Sección' },
            { key: 'nivel', label: 'Nivel' },
            { key: 'estado', label: 'Estado', type: 'badge' },
          ],
          rows: [
            { periodo: '2025 | Segundo semestre', seccion: '10-2', nivel: 'Décimo', estado: 'Activa' },
            { periodo: '2026 | Primer semestre', seccion: '11-1', nivel: 'Undécimo', estado: 'Activa' },
            { periodo: '2026 | Segundo semestre', seccion: student.section, nivel: student.level, estado: 'Activa' },
          ],
          tableTitle: 'Historial de matrícula',
          tableDescription: 'Resumen de periodos y secciones vinculadas al estudiante.',
        };
      }

      return {
        ...base,
        title: 'Detalle del estudiante',
        subtitle: `Consulte la información general de ${student.name}.`,
        actions: role === 'Administrador' ? [action('Editar', `/estudiantes/${id}/editar`, 'primary')] : [],
        formTitle: 'Detalle del estudiante',
        formFields: [
          { key: 'nombre', label: 'Nombre', type: 'text', value: student.name, section: 'Datos personales' },
          { key: 'cedula', label: 'Cédula', type: 'text', value: student.id, section: 'Datos personales' },
          { key: 'correo', label: 'Correo', type: 'text', value: student.email, section: 'Contacto' },
          { key: 'seccion', label: 'Sección', type: 'text', value: student.section, section: 'Información académica' },
          { key: 'nivel', label: 'Nivel', type: 'text', value: student.level, section: 'Información académica' },
          { key: 'profesorGuia', label: 'Profesor guía', type: 'text', value: studentDetail?.guideTeacher ?? 'No definido', section: 'Información académica' },
        ],
        readOnly: true,
        columns: [],
        rows: [],
      };
    }

    if (entity === 'secciones' && mode === 'detail') {
      return {
        ...base,
        title: section,
        subtitle: role === 'Administrador' ? 'Detalle de la sección académica.' : 'Consulta en solo lectura de la sección y sus estudiantes.',
        actions: role === 'Administrador' ? [action('Editar', `/secciones/${id}/editar`, 'primary')] : [],
        formTitle: 'Detalle de la sección',
        formFields: [
          { key: 'nombre', label: 'Nombre de sección', type: 'text', value: section, section: 'Información general' },
          { key: 'nivel', label: 'Nivel', type: 'text', value: section === '12-1' ? 'Duodécimo' : 'Undécimo', section: 'Información general' },
          { key: 'periodo', label: 'Periodo', type: 'text', value: '2026 | Segundo semestre', section: 'Información general' },
          { key: 'guia', label: 'Profesor guía', type: 'text', value: section === '11-1' ? 'Profesora Ana' : section === '11-2' ? 'Rosa Mendoza' : 'Luis Poveda', section: 'Información general' },
          { key: 'cantidad', label: 'Cantidad de estudiantes', type: 'text', value: String(sectionStudents.length || 29), section: 'Información general' },
          { key: 'asignatura', label: 'Asignatura que imparte', type: 'text', value: role === 'Profesor Guía' ? 'Teoría del Conocimiento' : role === 'Profesor' ? 'Historia' : 'Historia', section: 'Carga académica' },
        ],
        readOnly: true,
        columns: [
          { key: 'nombre', label: 'Nombre' },
          { key: 'cedula', label: 'Cédula' },
          { key: 'correo', label: 'Correo' },
          { key: 'estado', label: 'Estado', type: 'badge' },
        ],
        rows: sectionStudents.map((item) => ({ nombre: item.name, cedula: item.id, correo: item.email, estado: 'Activo' })),
        tableTitle: 'Estudiantes de la sección',
        tableDescription: 'Consulta de estudiantes vinculados a la sección seleccionada.',
      };
    }

    const titles: Record<string, { create: string; detail: string; edit: string }> = {
      usuarios: { create: 'Registrar usuario', detail: 'Detalle del usuario', edit: 'Editar usuario' },
      profesores: { create: 'Registrar profesor', detail: 'Detalle del profesor', edit: 'Editar profesor' },
      periodos: { create: 'Registrar periodo académico', detail: 'Detalle del periodo académico', edit: 'Editar periodo académico' },
      secciones: { create: 'Registrar sección', detail: 'Detalle de la sección', edit: 'Editar sección' },
      matriculas: { create: 'Registrar matrícula', detail: 'Detalle de la matrícula', edit: 'Editar matrícula' },
      escalas: { create: 'Registrar tipo de escala', detail: 'Detalle del tipo de escala', edit: 'Editar tipo de escala' },
      asignaturas: { create: 'Registrar asignatura', detail: 'Detalle de la asignatura', edit: 'Editar asignatura' },
      asignaciones: { create: 'Registrar asignación académica', detail: 'Detalle de la asignación académica', edit: 'Editar asignación académica' },
    };
    const entry = titles[entity];
    const backPath = `/${entity}`;

    return {
      ...base,
      title: entry?.[mode === 'create' ? 'create' : mode === 'edit' ? 'edit' : 'detail'] ?? base.title,
      subtitle:
        mode === 'create'
          ? `Complete el formulario correspondiente para ${entry?.create.toLowerCase() ?? 'registrar el elemento'}.`
          : mode === 'edit'
            ? `Actualice la información de ${getEntityLabel(entity).toLowerCase()}.`
            : `Consulte la información registrada de ${getEntityLabel(entity).toLowerCase()}.`,
      actions: mode === 'detail' && role === 'Administrador' ? [action('Editar', `${backPath}/${id}/editar`, 'primary')] : [action('Cancelar', backPath)],
      formTitle: entry?.[mode === 'create' ? 'create' : mode === 'edit' ? 'edit' : 'detail'] ?? base.formTitle,
      formSubmitLabel: mode === 'create' ? 'Guardar' : 'Guardar cambios',
      readOnly: mode === 'detail',
      columns: [],
      rows: [],
    };
  }

  getGuideSectionData(): GuideSectionData {
    return {
      period: '2026 | Segundo semestre',
      section: '11-1',
      level: 'Undécimo',
      guideTeacher: 'Profesora Ana',
      count: '29 estudiantes',
      students: STUDENTS.filter((student) => student.section === '11-1'),
    };
  }

  getStudentAcademicDetail(studentName: string): StudentAcademicDetail | undefined {
    return getStudentDetailByName(studentName);
  }

  getMonographs(): MonographDetail[] {
    return MONOGRAPHS;
  }

  getMonographById(id: string): MonographDetail | undefined {
    return MONOGRAPHS.find((item) => item.id === id || slugify(item.student) === id || slugify(item.title) === id);
  }

  getMonographReport(studentName: string): MonographReport | undefined {
    return getStudentDetailByName(studentName)?.monographReport;
  }

  getLatestMonographObservation(studentName: string): string {
    return getStudentDetailByName(studentName)?.monographReport?.observations ?? 'Sin observaciones registradas.';
  }

  getProfessorIndividualReport(studentName: string) {
    const detail = getStudentDetailByName(studentName) ?? getStudentDetailByName('Ana López')!;

    return {
      student: detail.student,
      subjects: detail.subjects,
      absenteeism: detail.absenteeism,
      observations: detail.subjects.map((item) => `${item.subject}: ${item.observations}`),
    };
  }

  getGuideIndividualReport(studentName: string) {
    const detail = getStudentDetailByName(studentName) ?? getStudentDetailByName('Ana López')!;

    return {
      student: detail.student,
      subjects: detail.subjects,
      absenteeism: detail.absenteeism,
      monographReport: detail.monographReport,
    };
  }

  getGuideConsolidatedRows(section: string): Array<Record<string, string>> {
    return STUDENTS.filter((student) => student.section === section)
      .map((student) => {
        const detail = getStudentDetailByName(student.name)!;
        const bySubject = Object.fromEntries(detail.subjects.map((subject) => [subject.subject, subject.obtainedValue]));

        return {
          estudiante: student.name,
          matematica: String(bySubject['Matemática'] ?? '-'),
          historia: String(bySubject['Historia'] ?? '-'),
          lenguaB: String(bySubject['Lengua B'] ?? '-'),
          estudiosSociales: String(bySubject['Estudios Sociales'] ?? '-'),
          teoriaConocimiento: String(bySubject['Teoría del Conocimiento'] ?? '-'),
        };
      });
  }

  getGuideSectionSummary(section: string) {
    const sectionStudents = STUDENTS.filter((student) => student.section === section);
    const details = sectionStudents.map((student) => getStudentDetailByName(student.name)!);

    return {
      students: `${sectionStudents.length} mostrados de 29 registrados`,
      evaluations: `${details.reduce((total, detail) => total + detail.subjects.length, 0)} registros de notas`,
      absenteeism: `${details.reduce((total, detail) => total + detail.absenteeism.justifiedAbsences + detail.absenteeism.unjustifiedAbsences, 0)} ausencias totales`,
      observations: 'Predomina un buen desempeño general con focos de seguimiento en argumentación y resolución de problemas.',
      academicInfo: 'La sección mantiene estabilidad en Historia, Lengua B y Estudios Sociales; Matemática requiere acompañamiento focalizado.',
    };
  }

  getCoordinatorMonographReport(studentName: string) {
    const report = this.getMonographReport(studentName) ?? this.getMonographReport('Ana López')!;
    const monograph = MONOGRAPHS.find((item) => item.student === report.student)!;

    return {
      report,
      observations: monograph.followUps.map((followUp) => ({
        label: `${followUp.date} · ${followUp.professor}`,
        value: followUp.note,
      })),
    };
  }

  getMonographReportTable(studentName: string, observation?: string) {
    const report = this.getMonographReport(studentName) ?? this.getMonographReport('Ana López')!;

    return [
      {
        area: report.area,
        supervisor: report.supervisor,
        observaciones: observation ?? report.observations,
      },
    ];
  }

  getProfessorStudents() {
    return ['Ana López', 'Juan Mora', 'María Solís'];
  }

  getGuideStudents() {
    return this.getGuideSectionData().students.map((student) => student.name);
  }

  getPeriods() {
    return ['2026 | Segundo semestre', '2027 | Primer semestre'];
  }

  getSections() {
    return ['11-1', '11-2', '12-1'];
  }
}
