import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <span>© 2026 Instituto de Educación Dr. Clodomiro Picado</span>
       <span class="footer__portal">IET BI Portal</span>
      <nav class="footer__links" aria-label="Enlaces de ayuda">
        <a href="mailto:soporte@institucion.edu?subject=Ayuda%20IET%20BI%20Portal">Ayuda</a>
        <a href="mailto:soporte@institucion.edu">Soporte</a>
      </nav>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
       height: 34px;
       padding: 0 1.5rem;
       color: #8996a4;
       background:#fff;
       font-size: .68rem;
       border-top: 1px solid #e5e8ec;
    }

    .footer__links {
      display: flex;
      gap: 1rem;
    }

    .footer__links a {
       color: #4099ff;
       text-decoration: none;
     }
     @media(max-width:700px){.footer__portal{display:none}}
  `,
})
// Muestra el pie común de la aplicación.
export class FooterComponent {}
