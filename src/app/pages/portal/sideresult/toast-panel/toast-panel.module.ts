import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoPanelModule, IgoStopPropagationModule, IgoActionModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core';
import { IgoSearchResultsModule } from '@igo2/geo';
import { IgoFeatureModule } from '../feature/feature.module';

import { ToastPanelComponent } from './toast-panel.component';
import { MatBadgeModule } from '@angular/material/badge';

@NgModule({
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    IgoLanguageModule,
    IgoPanelModule,
    IgoStopPropagationModule,
    IgoActionModule,
    IgoFeatureModule,
    IgoSearchResultsModule
  ],
  exports: [ToastPanelComponent],
  declarations: [ToastPanelComponent]
})
export class AppToastPanelModule {}