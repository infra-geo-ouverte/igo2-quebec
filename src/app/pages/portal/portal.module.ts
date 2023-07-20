import { LegendButtonModule } from './legend-button/legend-button.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { LegendDialogModule} from './legend-dialog/legend-dialog.module';
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
  IgoLayerModule,
  IgoSearchModule
} from '@igo2/geo';
import {
  IgoContextManagerModule,
  IgoContextMapButtonModule
} from '@igo2/context';

import { MatSidenavModule } from '@angular/material/sidenav';
import { IgoAppSearchBarModule, IgoIntegrationModule } from '@igo2/integration';
import { MapOverlayModule } from './map-overlay/map-overlay.module';

import { PortalComponent } from './portal.component';
import { FooterModule } from './../footer/footer.module';
import { AppPanelsModule } from './panels/panels.module';

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
    FooterModule,
    IgoLayerModule,
    IgoWorkspaceModule,
    IgoGeoWorkspaceModule,
    IgoQueryModule.forRoot(),
    IgoSearchModule.forRoot(),
    IgoContextMapButtonModule,
    MatDialogModule,
    IgoActionModule,
    IgoImportExportModule,
    MapOverlayModule,
    AppPanelsModule,
    IgoPanelModule,
    IgoBackdropModule,
    IgoContextMenuModule,
    IgoToolModule,
    IgoEntityTableModule,
    IgoEntityTablePaginatorModule,
    LegendDialogModule,
    MatSidenavModule,
    IgoAppSearchBarModule,
    IgoSearchModule,
    LegendButtonModule
  ],
  exports: [PortalComponent],
  declarations: [PortalComponent]
})
export class PortalModule {}
