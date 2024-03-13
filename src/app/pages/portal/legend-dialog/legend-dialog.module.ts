import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoLanguageModule } from '@igo2/core/language';
import { IgoLayerModule, IgoMapModule } from '@igo2/geo';

import { LegendDialogComponent } from './legend-dialog.component';

@NgModule({
    imports: [
        MatIconModule,
        MatDialogModule,
        IgoLayerModule,
        IgoMapModule,
        MatButtonModule,
        MatTooltipModule,
        IgoLanguageModule,
        LegendDialogComponent
    ],
    exports: [LegendDialogComponent]
})
export class LegendDialogModule {}
