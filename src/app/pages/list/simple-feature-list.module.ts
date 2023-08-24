import { SimpleFeatureListHeaderComponent } from './simple-feature-list-header/simple-feature-list-header.component';
import { SimpleFeatureListPaginatorComponent } from './simple-feature-list-paginator/simple-feature-list-paginator.component';
import { IgoCustomHtmlModule } from '@igo2/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SimpleFeatureListComponent } from './simple-feature-list.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IgoLanguageModule } from '@igo2/core';
import { IgoImageModule } from '@igo2/common';
import { IgoEntityTablePaginatorModule } from '@igo2/common';
import { IgoStopPropagationModule } from '@igo2/common';

/**
 * @ignore
 */
@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    IgoStopPropagationModule,
    IgoCustomHtmlModule,
    IgoEntityTablePaginatorModule,
    IgoImageModule,
    IgoLanguageModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  exports: [
    SimpleFeatureListComponent
  ],
  declarations: [
    SimpleFeatureListHeaderComponent,
    SimpleFeatureListPaginatorComponent,
    SimpleFeatureListComponent
  ]
})
export class IgoSimpleFeatureListModule {}
