import { Component } from '@angular/core';
import { ConfigService } from '@igo2/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {
  public hasHeader = true;
  public hasMenu = true;

  constructor(private configService: ConfigService) {

    this.hasHeader = this.configService.getConfig('hasHeader') === undefined ? false :
      this.configService.getConfig('hasHeader');

    this.hasMenu = this.configService.getConfig('hasMenu') === undefined ? false :
      this.configService.getConfig('hasmenu');

   }

}
