import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PrototypeDataService } from '../data/prototype-data.service';
import { SessionUser, UserRole } from '../models/prototype.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly data = inject(PrototypeDataService);
  private readonly sessionState = signal<SessionUser | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);
  readonly isAuthenticated = computed(() => this.sessionState() !== null);

  loginAsRole(role: UserRole) {
    this.sessionState.set({ user: this.data.getUserByRole(role) });
    void this.router.navigateByUrl('/dashboard');
  }

  logout() {
    this.sessionState.set(null);
    void this.router.navigateByUrl('/login');
  }
}
