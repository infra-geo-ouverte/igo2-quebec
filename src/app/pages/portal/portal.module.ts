import { LegendButtonModule } from './legend-button/legend-button.module';
import {MatSidenavModule} from '@angular/material/sidenav';
import { SideSearchModule} from '././side-search/side-search.module';
import { FooterModule } from './../footer/footer.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoCoreModule } from '@igo2/core';
import {
  IgoEntityModule,
  IgoFlexibleModule,
  IgoWorkspaceModule
} from '@igo2/common';

import {
  IgoFeatureModule,
  IgoMapModule,
  IgoLayerModule,
  IgoGeoWorkspaceModule,
  IgoSearchModule,
  IgoQueryModule
} from '@igo2/geo';
import {
  IgoContextManagerModule,
  IgoContextMapButtonModule
} from '@igo2/context';

import { IgoIntegrationModule } from '@igo2/integration';

import { PortalComponent } from './portal.component';

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
    SideSearchModule,
    MatSidenavModule
  ],
  exports: [PortalComponent],
  declarations: [PortalComponent]
})
export class PortalModule {}