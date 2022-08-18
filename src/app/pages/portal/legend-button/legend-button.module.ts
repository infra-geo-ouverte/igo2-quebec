import { LegendButtonComponent, LegendButtonDialogComponent } from './legend-button.component';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

@NgModule({
  declarations: [LegendButtonComponent, LegendButtonDialogComponent],
  imports: [
    MatIconModule,
    MatDialogModule,
    IgoLayerModule,
    IgoMapModule,
    MatButtonModule
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
  bootstrap: [LegendButtonComponent],
})
export class LegendButtonModule { }
