import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FooterModule } from '../footer/footer.module';
import { PortalModule } from '../portal';
import { AboutComponent } from './menu-pages/about/about.component';
import { HomeComponent } from './menu-pages/home/home.component';
import { MapComponent } from './menu-pages/map/map.component';
import { MenuRoutingModule } from './menu-routing/menu-routing.module';
import { MenuComponent } from './menu.component';

@NgModule({
  declarations: [MenuComponent, HomeComponent, AboutComponent, MapComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MenuRoutingModule,
    PortalModule,
    FooterModule,
    MatToolbarModule
  ],
  exports: [MenuComponent, MenuRoutingModule]
})
export class MenuModule {}
