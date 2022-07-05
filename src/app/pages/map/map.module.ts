import { HeaderComponent } from './../header/header.component';
import { FooterComponent } from '../footer/footer.component';
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
    HeaderComponent,
    FooterComponent
    ],
  exports: [
    MapComponent,
    HeaderComponent,
    FooterComponent
  ]
})
export class MapModule { }
