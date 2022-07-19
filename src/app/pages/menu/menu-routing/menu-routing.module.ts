import { StationsComponent } from './../menu-pages/stations/stations.component';
import { HomeComponent } from '../menu-pages/home/home.component';
import { AboutComponent } from '../menu-pages/about/about.component';
import { MapComponent } from '../menu-pages/map/map.component';

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'carte', component: MapComponent },
    { path: 'stations', component: StationsComponent },
    { path: 'en-savoir-plus', component: AboutComponent }
  ];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      relativeLinkResolution: 'legacy'
  })],
    exports: [RouterModule],
  })
  export class MenuRoutingModule { }
