import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoStopPropagationModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core';
import { IgoSearchResultsModule } from '@igo2/geo';
import { IgoFeatureModule } from '../feature.module';
import { FeatureInfoComponent } from './feature-info.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    IgoLanguageModule,
    IgoStopPropagationModule,
    IgoFeatureModule,
    IgoSearchResultsModule
  ],
  exports: [FeatureInfoComponent],
  declarations: [FeatureInfoComponent]
})
export class AppFeatureInfoModule {}
