import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <span>© 2026 Instituto de Educación Dr. Clodomiro Picado</span>
      <span>Sistema de Reportes Académicos</span>
      <nav class="footer__links" aria-label="Enlaces de ayuda">
        <a href="#">Ayuda</a>
        <a href="#">Soporte</a>
      </nav>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 0 0;
      color: #6b7280;
      font-size: 0.92rem;
      flex-wrap: wrap;
      border-top: 1px solid #e3ebf3;
      margin-top: 1.25rem;
    }

    .footer__links {
      display: flex;
      gap: 1rem;
    }

    .footer__links a {
      color: #2f6b9a;
      text-decoration: none;
    }
  `,
})
export class FooterComponent {}
