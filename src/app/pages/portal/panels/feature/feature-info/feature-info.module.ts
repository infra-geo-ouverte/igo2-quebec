import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoStopPropagationModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core';
import { IgoFeatureModule } from '@igo2/geo';

import { AppFeatureModule } from '../feature.module';
import { FeatureInfoComponent } from './feature-info.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    IgoLanguageModule,
    IgoStopPropagationModule,
    AppFeatureModule,
    IgoFeatureModule
  ],
  exports: [FeatureInfoComponent],
  declarations: [FeatureInfoComponent]
})
export class AppFeatureInfoModule {}
