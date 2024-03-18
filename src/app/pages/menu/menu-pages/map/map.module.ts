import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { IgoLanguageModule } from '@igo2/core/language';

import { MapComponent } from './map.component';

import { MapComponent } from './map.component';

@NgModule({
  declarations: [MapComponent],
  imports: [CommonModule, IgoLanguageModule],
  exports: [MapComponent]
})
export class MapModule {}
