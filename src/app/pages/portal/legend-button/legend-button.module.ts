import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoLanguageModule } from '@igo2/core/language';
import { IgoLayerModule, IgoMapModule } from '@igo2/geo';

import { LegendDialogModule } from '../legend-dialog/legend-dialog.module';
import { LegendButtonComponent } from './legend-button.component';

@NgModule({
    imports: [
        CommonModule,
        MatButtonModule,
        IgoMapModule,
        IgoLayerModule,
        MatTooltipModule,
        IgoLanguageModule,
        MatDialogModule,
        LegendDialogModule,
        LegendButtonComponent
    ],
    exports: [LegendButtonComponent]
})
export class LegendButtonModule {}
