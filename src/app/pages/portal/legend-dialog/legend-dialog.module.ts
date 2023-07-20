import { LegendDialogComponent } from './legend-dialog.component';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatDialogModule } from '@angular/material/dialog';

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
