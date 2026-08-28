import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PrototypeDataService } from '../../core/data/prototype-data.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside id="main-navigation" class="sidebar" [class.sidebar--open]="isOpen()" aria-label="Navegación principal">
      <div class="sidebar__header">
        <p class="sidebar__title">Menú principal</p>
        <button type="button" class="sidebar__close" aria-label="Cerrar menú principal" (click)="close.emit()">Cerrar</button>
      </div>

      <nav class="sidebar__nav">
        @for (section of menu(); track section.title) {
          <div class="sidebar__group">
            <p class="sidebar__group-title">{{ section.title }}</p>

            @for (item of section.items; track item.label) {
              @if (item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="is-active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  #activeLink="routerLinkActive"
                  [attr.aria-current]="activeLink.isActive ? 'page' : null"
                  class="sidebar__link"
                  (click)="close.emit()"
                >
                  {{ item.label }}
                </a>
              } @else {
                <button type="button" class="sidebar__link sidebar__link--button" (click)="logout()">
                  {{ item.label }}
                </button>
              }
            }
          </div>
        }
      </nav>
    </aside>
  `,
  styles: `
    .sidebar {
      background: #fff;
      border-radius: 28px;
      padding: 1rem;
      border: 1px solid rgba(47, 107, 154, 0.14);
      box-shadow: 0 24px 50px rgba(30, 58, 95, 0.08);
      position: sticky;
      top: 1rem;
    }

    .sidebar__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .sidebar__title {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.76rem;
      color: #2f6b9a;
      font-weight: 700;
    }

    .sidebar__close {
      display: none;
      border: 0;
      background: transparent;
      color: #667085;
      cursor: pointer;
    }

    .sidebar__nav {
      display: grid;
      gap: 1rem;
    }

    .sidebar__group {
      display: grid;
      gap: 0.35rem;
    }

    .sidebar__group-title {
      margin: 0 0 0.25rem;
      color: #667085;
      font-size: 0.83rem;
      font-weight: 700;
    }

    .sidebar__link {
      width: 100%;
      padding: 0.85rem 0.95rem;
      border-radius: 16px;
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: 0.2s ease;
      border: 1px solid transparent;
      text-align: left;
    }

    .sidebar__link--button {
      background: transparent;
      cursor: pointer;
    }

    .sidebar__link:hover,
    .sidebar__link.is-active {
      color: #1e3a5f;
      background: #eaf3f8;
      border-color: rgba(47, 107, 154, 0.18);
    }

    @media (max-width: 980px) {
      .sidebar {
        display: none;
        position: fixed;
        inset: 1rem 1rem auto 1rem;
        z-index: 20;
        top: 88px;
        max-height: calc(100vh - 110px);
        overflow: auto;
      }

      .sidebar--open {
        display: block;
      }

      .sidebar__close {
        display: inline-flex;
      }
    }
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly data = inject(PrototypeDataService);

  isOpen = input(false);
  close = output<void>();

  protected readonly menu = computed(() => {
    const role = this.auth.currentRole();
    return role ? this.data.getMenu(role) : [];
  });

  protected logout() {
    this.auth.logout();
    this.close.emit();
  }
}
