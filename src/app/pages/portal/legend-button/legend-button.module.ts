import { LegendButtonComponent } from './legend-button.component';
import { LegendButtonDialogComponent } from './legend-button-dialog.component';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@NgModule({
  declarations: [LegendButtonComponent, LegendButtonDialogComponent],
  imports: [
    MatIconModule,
    MatDialogModule,
    IgoLayerModule,
    IgoMapModule,
    MatButtonModule,
    MatTooltipModule,
    IgoLanguageModule
  ],
  providers:
  [{
    provide: 'app-legend-button-dialog',
    useValue: LegendButtonDialogComponent,
},
      {provide:MatDialogRef , useValue:{} },

      { provide: MAT_DIALOG_DATA, useValue: {} }

],
  exports: [
    LegendButtonComponent,
    LegendButtonDialogComponent,
    MatIconModule
  ],
  bootstrap: [LegendButtonComponent, LegendButtonDialogComponent],
})
export class LegendButtonModule { }
