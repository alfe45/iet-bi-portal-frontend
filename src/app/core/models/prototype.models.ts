export type UserRole =
  | 'Administrador'
  | 'Profesor'
  | 'Profesor Guía'
  | 'Profesor Guía de Monografía';

export interface AppUser {
  id: number;
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  avatar: string;
  sectionGuide?: string;
}

export interface SessionUser {
  user: AppUser;
}

export interface MenuItem {
  label: string;
  path?: string;
  action?: 'logout';
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface StatCard {
  label: string;
  value: string;
  trend?: string;
  tone?: 'primary' | 'success' | 'danger' | 'neutral';
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'avatar' | 'actions' | 'list';
}

export interface PageAction {
  label: string;
  path?: string;
  tone?: 'primary' | 'ghost' | 'danger';
}

export interface TableAction {
  label: string;
  path?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'date' | 'textarea';
  value?: string;
  options?: string[];
  section?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FeaturePageData {
  title: string;
  subtitle: string;
  alert?: string;
  stats?: StatCard[];
  filters?: Array<{ label: string; value: string; options: string[] }>;
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  actions: Array<PageAction | string>;
  tableTitle?: string;
  tableDescription?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  formTitle: string;
  formFields: FormField[];
  formSubmitLabel?: string;
  readOnly?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

export interface DashboardData {
  heroTitle: string;
  heroText: string;
  cards: StatCard[];
  quickActions: string[];
  highlights: string[];
}

export interface StudentOverview {
  name: string;
  id: string;
  email: string;
  section: string;
  level: string;
  monograph: string;
}

export interface SubjectPerformance {
  subject: string;
  minimumValue: string;
  obtainedValue: string;
  observations: string;
}

export interface AbsenteeismSummary {
  tardies: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
}

export interface MonographReport {
  period: string;
  student: string;
  monograph: string;
  area: string;
  supervisor: string;
  observations: string;
}

export interface StudentAcademicDetail {
  student: StudentOverview;
  guideTeacher: string;
  subjects: SubjectPerformance[];
  absenteeism: AbsenteeismSummary;
  monographReport?: MonographReport;
}

export interface GuideSectionData {
  period: string;
  section: string;
  level: string;
  guideTeacher: string;
  count: string;
  students: StudentOverview[];
}

export interface MonographDetail {
  id: string;
  student: string;
  title: string;
  area: string;
  supervisor: string;
  status: string;
  startDate: string;
  description: string;
  followUps: Array<{ date: string; professor: string; status: string; note: string }>;
}
