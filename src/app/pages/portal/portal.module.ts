import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  IgoActionModule,
  IgoBackdropModule,
  IgoContextMenuModule,
  IgoEntityModule,
  IgoEntityTableModule,
  IgoEntityTablePaginatorModule,
  IgoFlexibleModule,
  IgoPanelModule,
  IgoToolModule,
  IgoWorkspaceModule
} from '@igo2/common';
import {
  IgoContextManagerModule,
  IgoContextMapButtonModule
} from '@igo2/context';
import { IgoCoreModule } from '@igo2/core';
import {
  IgoFeatureModule,
  IgoGeoWorkspaceModule,
  IgoImportExportModule,
  IgoLayerModule,
  IgoMapModule,
  IgoQueryModule,
  IgoSearchModule
} from '@igo2/geo';
import { IgoAppSearchBarModule, IgoIntegrationModule } from '@igo2/integration';

import { PortalComponent } from './portal.component';

@NgModule({
  imports: [
    IgoLayerModule,
    IgoAppSearchBarModule,
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
    IgoContextManagerModule,
    IgoContextMapButtonModule,
    IgoEntityTableModule,
    IgoEntityTablePaginatorModule,
    PortalComponent
  ],
  exports: [PortalComponent]
})
export class PortalModule {}
