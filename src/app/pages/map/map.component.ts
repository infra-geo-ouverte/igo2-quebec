import { Component } from '@angular/core';

import { MapScreenComponent } from '@igo2/sdg/geo';

import { AppService } from '../../app.service';

@Component({
  selector: 'app-map-page',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [MapScreenComponent]
})
export class MapComponent {
  get isHandset() {
    return this.appService.isHandset;
  }

  constructor(private appService: AppService) {}
}
