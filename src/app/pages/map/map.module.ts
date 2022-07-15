import { HeaderComponent } from './../header/header.component';
import { MapComponent } from './map.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IgoLanguageModule } from '@igo2/core';
import { PortalModule } from '@angular/cdk/portal';

@NgModule({
  declarations: [
    MapComponent
  ],
  imports: [
    CommonModule,
    IgoLanguageModule,
    HeaderComponent,
    PortalModule
    ],
  exports: [
    MapComponent
  ]
})
export class MapModule { }
