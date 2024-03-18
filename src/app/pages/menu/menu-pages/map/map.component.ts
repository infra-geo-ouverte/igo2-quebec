import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import { ConfigService } from '@igo2/core/config';

import { PortalComponent } from '../../../portal/portal.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [PortalComponent, NgClass]
})
export class MapComponent {
  public hasHeader = true;

  constructor(private configService: ConfigService) {
    this.hasHeader =
      this.configService.getConfig('header.hasHeader') === undefined
        ? false
        : this.configService.getConfig('header.hasHeader');
  }
}
