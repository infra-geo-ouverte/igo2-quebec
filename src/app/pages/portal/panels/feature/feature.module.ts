import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { IgoFeatureFormModule } from '@igo2/geo';

import { FeatureCustomDetailsModule } from './feature-custom-details/feature-custom-details.module';

@NgModule({
  imports: [CommonModule],
  exports: [FeatureCustomDetailsModule, IgoFeatureFormModule],
  declarations: [],
  providers: []
})
export class AppFeatureModule {}
