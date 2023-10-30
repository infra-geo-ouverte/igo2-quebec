import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { HomeComponent } from './menu-pages/home/home.component';
import { MenuRoutingModule } from './menu-routing/menu-routing.module';
import { AboutComponent } from './menu-pages/about/about.component';
import { MapComponent } from './menu-pages/map/map.component';
import { FooterModule } from '../footer/footer.module';
import { PortalModule } from '../portal';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  declarations: [
    MenuComponent,
    HomeComponent,
    AboutComponent,
    MapComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MenuRoutingModule,
    PortalModule,
    FooterModule,
    MatToolbarModule
  ],
  exports:[
    MenuComponent,
    MenuRoutingModule
  ]
})
export class MenuModule { }
