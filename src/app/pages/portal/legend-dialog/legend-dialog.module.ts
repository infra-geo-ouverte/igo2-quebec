import { LegendDialogButtonComponent } from './legend-dialog-button.component';
import { LegendDialogComponent } from './legend-dialog.component';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IgoMapModule, IgoLayerModule } from '@igo2/geo';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@NgModule({
  declarations: [LegendDialogButtonComponent, LegendDialogComponent],
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
    provide: 'app-legend-dialog',
    useValue: LegendDialogComponent,
},
      {provide:MatDialogRef , useValue:{} },

      { provide: MAT_DIALOG_DATA, useValue: {} }

],
  exports: [
    LegendDialogButtonComponent,
    LegendDialogComponent,
    MatIconModule
  ],
  bootstrap: [LegendDialogButtonComponent, LegendDialogComponent],
})
export class LegendDialogModule { }
