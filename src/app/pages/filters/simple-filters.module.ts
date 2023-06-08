import { IgoStopPropagationModule } from '@igo2/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SimpleFiltersComponent } from './simple-filters.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { IgoImageModule } from '@igo2/common';
import { IgoCustomHtmlModule } from '@igo2/common';
import { IgoLanguageModule } from '@igo2/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SimpleFiltersTemporaryHeaderComponent } from './simple-filters-temporary-header/simple-filters-temporary-header.component';

/**
 * @ignore
 */
@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    IgoStopPropagationModule,
    IgoCustomHtmlModule,
    IgoImageModule,
    IgoLanguageModule
  ],
  exports: [
    SimpleFiltersComponent
  ],
  declarations: [
    SimpleFiltersComponent,
    SimpleFiltersTemporaryHeaderComponent
  ]
})
export class IgoSimpleFiltersModule {}
