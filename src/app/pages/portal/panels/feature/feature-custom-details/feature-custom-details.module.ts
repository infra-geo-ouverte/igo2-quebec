import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { IgoImageModule, IgoKeyValueModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core/language';

import { FeatureCustomDetailsComponent } from './feature-custom-details.component';

/**
 * @ignore
 */
@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        IgoLanguageModule,
        IgoKeyValueModule,
        RouterModule,
        IgoImageModule,
        MatTooltipModule,
        FeatureCustomDetailsComponent
    ],
    exports: [FeatureCustomDetailsComponent]
})
export class FeatureCustomDetailsModule {}
