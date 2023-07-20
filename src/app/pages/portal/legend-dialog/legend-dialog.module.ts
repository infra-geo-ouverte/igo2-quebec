import { LegendDialogComponent } from './legend-dialog.component';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';

@NgModule({
  declarations: [LegendDialogComponent],
  imports: [
    MatIconModule,
    MatDialogModule,
    IgoLayerModule,
    IgoMapModule,
    MatButtonModule,
    MatTooltipModule,
    IgoLanguageModule
  ],
  exports: [
    LegendDialogComponent
  ]
})
export class LegendDialogModule { }
