import { IgoSearchBarModule } from '@igo2/geo';
import { AppSideResultModule } from './sideresult/sideresult.module';
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
  IgoSearchModule,
  IgoLayerModule
} from '@igo2/geo';
import {
  IgoContextManagerModule,
  IgoContextMapButtonModule
} from '@igo2/context';

import { IgoIntegrationModule } from '@igo2/integration';
import { MapOverlayModule } from './map-overlay/map-overlay.module';
import { AppExpansionPanelModule } from './expansion-panel/expansion-panel.module';
import { AppSidenavModule } from './sidenav/sidenav.module';

import { PortalComponent } from './portal.component';

import { LegendButtonModule } from './legend-button/legend-button.module';
import { FooterModule } from './../footer/footer.module';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    IgoCoreModule,
    IgoFeatureModule,
    IgoMapModule,
    IgoEntityModule,
    IgoFlexibleModule,
    IgoIntegrationModule,
    IgoContextManagerModule,
    IgoContextMapButtonModule,
    FooterModule,
    LegendButtonModule,
    IgoLayerModule,
    IgoWorkspaceModule,
    IgoGeoWorkspaceModule,
    IgoQueryModule.forRoot(),
    IgoSearchModule.forRoot(),
    IgoContextMapButtonModule,
    MatSidenavModule,
    MatDialogModule,
    IgoActionModule,
    IgoImportExportModule,
    MapOverlayModule,
    AppExpansionPanelModule,
    AppSidenavModule,
    AppSideResultModule,
    IgoPanelModule,
    IgoBackdropModule,
    IgoContextMenuModule,
    IgoToolModule,
    IgoEntityTableModule,
    IgoEntityTablePaginatorModule,
    IgoSearchBarModule
  ],
  exports: [PortalComponent],
  declarations: [PortalComponent]
})
export class PortalModule {}
