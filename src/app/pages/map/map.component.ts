import { Component } from '@angular/core';
import {
  ConfigService
} from '@igo2/core';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {
  public hasFooter = true;
  public FooterComponent = FooterComponent;

  constructor(private configService: ConfigService) {

    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
    this.configService.getConfig('hasFooter');

   }

}
