import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet]
})
export class MenuComponent {
  public color = 'accent';

  constructor() {}
}
