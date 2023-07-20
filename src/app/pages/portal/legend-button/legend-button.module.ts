import { LegendButtonComponent } from './legend-button.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegendDialogModule } from '../legend-dialog/legend-dialog.module';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';

@NgModule({
  declarations: [LegendButtonComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    IgoMapModule, IgoLayerModule,
    MatTooltipModule,
    IgoLanguageModule,
    MatDialogModule,
    LegendDialogModule
  ],
  exports: [LegendButtonComponent]
})
export class LegendButtonModule { }
