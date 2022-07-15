//import { PortalComponent } from '../../portal/portal.component';
import { HomeComponent } from '../../../pages/home/home.component';
import { AboutComponent } from '../../../pages/about/about.component';
import { MapComponent } from '../../../pages/map/map.component';

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


//TODO permettre par config
const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'carte', component: MapComponent },
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
