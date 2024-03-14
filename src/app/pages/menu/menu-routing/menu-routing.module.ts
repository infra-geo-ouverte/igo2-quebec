import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from '../menu-pages/about/about.component';
import { HomeComponent } from '../menu-pages/home/home.component';
import { MapComponent } from '../menu-pages/map/map.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'carte', component: MapComponent },
  { path: 'en-savoir-plus', component: AboutComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload'
    })
  ],
  exports: [RouterModule]
})
export class MenuRoutingModule {}
