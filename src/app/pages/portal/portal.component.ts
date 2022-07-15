import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  ConfigService
} from '@igo2/core';

import {
  IgoMap
} from '@igo2/geo';

import {
  MapState
} from '@igo2/integration';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit {
  public showRotationButtonIfNoRotation = false;
  public hasFooter: boolean = undefined;
  public hasGeolocateButton = true;

  @ViewChild('mapBrowser', { read: ElementRef, static: true })
  mapBrowser: ElementRef;

  get map(): IgoMap {
    return this.mapState.map;
  }

  constructor(
    private mapState: MapState,
    private configService: ConfigService,
  ) {
    this.showRotationButtonIfNoRotation = this.configService.getConfig('showRotationButtonIfNoRotation') === undefined ? false :
      this.configService.getConfig('showRotationButtonIfNoRotation');
    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
      this.configService.getConfig('hasFooter');
  }

  ngOnInit() {
    window['IGO'] = this;
    this.hasGeolocateButton = this.configService.getConfig('hasGeolocateButton') === undefined ? true :
      this.configService.getConfig('hasGeolocateButton');

    this.map.ol.once('rendercomplete', () => {
      if (this.configService.getConfig('geolocate.activateDefault') !== undefined) {
        this.map.geolocationController.tracking = this.configService.getConfig('geolocate.activateDefault');
      }
    });
  }
}
