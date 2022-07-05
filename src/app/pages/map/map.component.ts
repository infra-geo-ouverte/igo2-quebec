import { MenuComponent } from '../menu/menu/menu.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { Component } from '@angular/core';
import {
  ConfigService
} from '@igo2/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {
  public hasFooter = true;
  public FooterComponent = FooterComponent;
  public hasHeader = true;
  public HeaderComponent = HeaderComponent;
  public hasMenu = true;
  public MenuComponent = MenuComponent;

  constructor(private configService: ConfigService) {

    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
    this.configService.getConfig('hasFooter');

    this.hasFooter = this.configService.getConfig('hasHeader') === undefined ? false :
    this.configService.getConfig('hasHeader');

    this.hasMenu = this.configService.getConfig('hasMenu') === undefined ? false :
    this.configService.getConfig('hasMenu');

   }

}
