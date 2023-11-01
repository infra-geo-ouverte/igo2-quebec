import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureCustomDetailsModule } from './feature-custom-details/feature-custom-details.module';
import { IgoFeatureFormModule } from '@igo2/geo';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    FeatureCustomDetailsModule,
    IgoFeatureFormModule
  ],
  declarations: [],
  providers: []
})
export class AppFeatureModule {}
