import { IgoSimpleFiltersModule } from './../filters/simple-filters.module';
import { IgoSimpleFeatureListModule } from './../list/simple-feature-list.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { IgoCoreModule } from '@igo2/core';
import {
  IgoActionModule,
  IgoWorkspaceModule,
  IgoEntityModule,
  IgoPanelModule,
  IgoBackdropModule,
  IgoFlexibleModule,
  IgoContextMenuModule,
  IgoToolModule,
  IgoEntityTableModule,
  IgoEntityTablePaginatorModule
} from '@igo2/common';

import {
  IgoGeoWorkspaceModule,
  IgoFeatureModule,
  IgoImportExportModule,
  IgoMapModule,
  IgoQueryModule,
  IgoSearchModule
} from '@igo2/geo';
import {
  IgoContextManagerModule,
  IgoContextMapButtonModule
} from '@igo2/context';

import { IgoIntegrationModule } from '@igo2/integration';
import { MapOverlayModule } from './map-overlay/map-overlay.module';
import { AppSidenavModule } from './sidenav/sidenav.module';

import { PortalComponent } from './portal.component';

import { LegendButtonModule } from './legend-button/legend-button.module';
import { AppSideResultModule } from './sideresult/sideresult.module';

@NgModule({
  imports: [
    IgoSimpleFeatureListModule,
    IgoSimpleFiltersModule,
    CommonModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatDialogModule,
    IgoCoreModule,
    IgoFeatureModule,
    IgoImportExportModule,
    IgoMapModule,
    IgoQueryModule.forRoot(),
    IgoSearchModule.forRoot(),
    IgoActionModule,
    IgoWorkspaceModule,
    IgoEntityModule,
    IgoGeoWorkspaceModule,
    IgoPanelModule,
    IgoToolModule,
    IgoContextMenuModule,
    IgoBackdropModule,
    IgoFlexibleModule,
    IgoIntegrationModule,
    AppSidenavModule,
    AppSideResultModule,
    MapOverlayModule,
    IgoContextManagerModule,
    IgoContextMapButtonModule,
    LegendButtonModule,
    IgoEntityTableModule,
    IgoEntityTablePaginatorModule,
  ],
    exports: [PortalComponent],
    declarations: [PortalComponent]
})
export class PortalModule {}
