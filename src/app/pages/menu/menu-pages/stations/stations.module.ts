import { IgoLanguageModule } from '@igo2/core';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { StationsComponent } from './stations.component';

import { StationListComponent } from './station-list/station-list.component';
import { StationListStationComponent } from './station-list/station-list-station/station-list-station.component';
import { StationListHeaderComponent } from './station-list/station-list-header/station-list-header.component';
import { StationListPaginatorComponent } from './station-list/station-list-paginator/station-list-paginator.component';

import { StationFiltersComponent } from './station-filters/station-filters.component';

import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    StationsComponent,
    StationListComponent,
    StationListStationComponent,
    StationListHeaderComponent,
    StationListPaginatorComponent,
    StationFiltersComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    IgoLanguageModule
  ],
  exports: [StationsComponent]
})
export class StationsModule { }
