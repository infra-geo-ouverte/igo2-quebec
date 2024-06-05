import { Component } from '@angular/core';

import { BasicScreenComponent } from '@igo2/sdg';

import { AppService } from '../../app.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [BasicScreenComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss'
})
export class ContactUsComponent {
  get isHandset() {
    return this.appService.isHandset;
  }

  constructor(private appService: AppService) {}
}
