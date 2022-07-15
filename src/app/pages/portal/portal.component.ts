import { FooterComponent } from '../footer/footer.component';
import { LegendButtonDialogComponent } from './legend-button/legend-button.component';
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
  public hasFooter = true;
  public FooterComponent = FooterComponent;
  public LegendButtonDialogComponent = LegendButtonDialogComponent;

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
  }
}
