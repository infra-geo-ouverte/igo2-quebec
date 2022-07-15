import { Header
import { MapComponent } from './map.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IgoLanguageModule } from '@igo2/core';

@NgModule({
  declarations: [
    MapComponent
  ],
  imports: [
    CommonModule,
    IgoLanguageModule,
    HeaderComponent
    ],
  exports: [
    MapComponent
  ]
})
export class MapModule { }
