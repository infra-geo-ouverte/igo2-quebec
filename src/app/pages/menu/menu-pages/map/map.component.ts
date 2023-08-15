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

  constructor(private configService: ConfigService) {


    this.useEmbeddedVersion = this.configService.getConfig('useEmbeddedVersion') === undefined ?
      false : this.configService.getConfig('useEmbeddedVersion');
    this.hasHeader = this.configService.getConfig('header.hasHeader') !== undefined && !this.useEmbeddedVersion ?
      this.configService.getConfig('header.hasHeader') : false;
   }

}
