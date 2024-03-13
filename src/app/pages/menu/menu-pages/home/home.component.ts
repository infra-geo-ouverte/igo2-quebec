import { Component } from '@angular/core';

@Component({
  selector: 'app-menu-home',
  templateUrl: './home.component.html',
  styles: [
    `
      .linkExtImg {
        max-height: 11px;
        max-width: 11px;
        margin-bottom: 0.16rem;
        float: left;
        display: inline;
        text-align: left;
      }
    `
  ],
  standalone: true
})
export class HomeComponent {
  getHomeComponent: any;

  constructor() {}
}
