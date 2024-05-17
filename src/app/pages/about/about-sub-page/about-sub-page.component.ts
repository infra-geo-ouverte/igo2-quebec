import { Component } from '@angular/core';

import { BasicScreenComponent } from '@igo2/sdg';

import { AppService } from '../../../app.service';

@Component({
  selector: 'app-about-sub-page',
  standalone: true,
  imports: [BasicScreenComponent],
  templateUrl: './about-sub-page.component.html',
  styleUrl: './about-sub-page.component.scss'
})
export class AboutSubPageComponent {
  get isHandset() {
    return this.appService.isHandset;
  }

  constructor(private appService: AppService) {}
}
