import { Component, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { BasicScreenComponent } from '@igo2/sdg';

import { AppService } from '../../../app/app.service';

@Component({
  selector: 'app-about-page',
  templateUrl: './about.component.html',
  standalone: true,
  imports: [BasicScreenComponent, RouterLink, MatButtonModule]
})
export class AboutComponent {
  get isHandset(): Signal<boolean> {
    return this.appService.isHandset;
  }

  constructor(private appService: AppService) {}
}
