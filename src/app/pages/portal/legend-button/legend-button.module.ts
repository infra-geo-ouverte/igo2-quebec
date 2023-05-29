import { LegendButtonComponent } from './legend-button.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegendDialogModule } from '../legend-dialog/legend-dialog.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatDialogModule } from '@angular/material/dialog';

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
