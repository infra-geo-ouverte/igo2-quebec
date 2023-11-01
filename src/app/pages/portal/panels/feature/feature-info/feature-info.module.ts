import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoStopPropagationModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core';
import { AppFeatureModule } from '../feature.module';
import { FeatureInfoComponent } from './feature-info.component';
import { IgoFeatureModule } from '@igo2/geo';

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
