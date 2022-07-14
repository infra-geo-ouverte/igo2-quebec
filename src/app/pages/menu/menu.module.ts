import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu/menu.component';
import { HomeComponent } from '../../pages/home/home.component';
import { MenuRoutingModule } from './menu-routing/menu-routing.module';
import { AboutComponent } from '../../pages/about/about.component';
import { MapComponent } from '../../pages/map/map.component';
import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module';
import { PortalModule } from '../portal';
import { MatIconModule } from '@angular/material/icon';
@NgModule({
  declarations: [
    MenuComponent,
    HomeComponent,
    AboutComponent,
    MapComponent
  ],
  imports: [
    CommonModule,
    MenuRoutingModule,
    PortalModule,
    HeaderModule,
    FooterModule,
    MatIconModule
  ],
  exports:[
    MenuComponent,
    MenuRoutingModule
  ]
})
export class MenuModule { }
