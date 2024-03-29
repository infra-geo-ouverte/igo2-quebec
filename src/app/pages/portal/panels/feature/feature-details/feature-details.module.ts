import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { IgoKeyValueModule, IgoImageModule } from '@igo2/common';
import { RouterModule } from '@angular/router';

import { FeatureDetailsComponent } from './feature-details.component';
import { FeatureDetailsCustomComponent } from './feature-details-custom.component';
import { FeatureDetailsDirective } from './feature-details.directive';

/**
 * @ignore
 */
@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    IgoLanguageModule,
    IgoKeyValueModule,
    RouterModule,
    IgoImageModule,
    MatTooltipModule
  ],
  exports: [
    FeatureDetailsComponent,
    FeatureDetailsCustomComponent,
    FeatureDetailsDirective],
  declarations: [
    FeatureDetailsComponent,
    FeatureDetailsCustomComponent,
    FeatureDetailsDirective]
})
export class IgoFeatureDetailsModule {}
