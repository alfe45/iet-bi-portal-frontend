import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, timer } from 'rxjs';
import { CursosLectivosApiService, PeriodoActualApi } from '../api/cursos-lectivos-api.service';

@Injectable({ providedIn: 'root' })
export class PeriodoActualService {
  private readonly cursosLectivosApi = inject(CursosLectivosApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periodo = signal<PeriodoActualApi | null>(null);
  readonly etiqueta = computed(() => {
    const periodo = this.periodo();
    if (!periodo) return 'Sin periodo activo';
    const semestre = periodo.semestreActual === 'I_SEMESTRE'
      ? 'Primer semestre'
      : periodo.semestreActual === 'II_SEMESTRE'
        ? 'Segundo semestre'
        : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  });

  constructor() {
    timer(0, 60_000).pipe(
      switchMap(() => this.cursosLectivosApi.obtenerActual().pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((periodo) => this.periodo.set(periodo));
  }
}
