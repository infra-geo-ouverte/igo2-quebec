import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { BasicScreenComponent } from '@igo2/sdg';

import { AppService } from '../../app.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [BasicScreenComponent, MatButtonModule]
})
export class HomeComponent {
  get isHandset() {
    return this.appService.isHandset;
  }

  constructor(private appService: AppService) {}
}
