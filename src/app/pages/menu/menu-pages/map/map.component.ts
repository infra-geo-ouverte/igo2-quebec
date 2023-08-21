import { Component } from '@angular/core';
import { ConfigService } from '@igo2/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {
  public hasHeader = true;
  public useEmbeddedVersion = false;
  public showMap = false;
  public showSimpleFilters = false;
  public showSimpleFeatureList = false;

  constructor(private configService: ConfigService) {

    this.showMap = this.configService.getConfig('useEmbeddedVersion.showMap') === undefined ? false : this.configService.getConfig('useEmbeddedVersion.showMap');
    this.showSimpleFilters = this.configService.getConfig('useEmbeddedVersion.simpleFilters') === undefined ? false : true;
    this.showSimpleFeatureList = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList') === undefined ? false : true;


    this.useEmbeddedVersion = this.configService.getConfig('useEmbeddedVersion') === undefined ?
      false : this.showMap || this.showSimpleFeatureList || this.showSimpleFilters;
    this.hasHeader = this.configService.getConfig('header.hasHeader') !== undefined && !this.useEmbeddedVersion ?
      this.configService.getConfig('header.hasHeader') : false;
   }

}
