import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  IgoActionbarModule,
  IgoContextMenuModule,
  IgoFlexibleModule,
  IgoPanelModule,
  IgoToolModule
} from '@igo2/common';
import { IgoContextManagerModule } from '@igo2/context';
// mobile
import { IgoLanguageModule } from '@igo2/core/language';
import { IgoMessageModule } from '@igo2/core/message';
import {
  IgoLayerModule,
  IgoMapModule,
  IgoSearchModule,
  IgoSearchResultsModule
} from '@igo2/geo';
import { IgoAppSearchModule } from '@igo2/integration';

import { BottomPanelComponent } from './bottompanel/bottompanel.component';
import { SidePanelComponent } from './sidepanel/sidepanel.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatTooltipModule,
    IgoLanguageModule,
    IgoPanelModule,
    IgoFlexibleModule,
    IgoContextManagerModule,
    IgoToolModule,
    //SEARCH
    MatCardModule,
    IgoMessageModule,
    IgoMapModule,
    IgoSearchModule,
    IgoActionbarModule,
    IgoContextMenuModule,
    IgoAppSearchModule,
    IgoSearchModule.forRoot(),
    MatExpansionModule,
    IgoLayerModule,
    IgoSearchResultsModule,
    SidePanelComponent,
    BottomPanelComponent
  ],
  exports: [SidePanelComponent, BottomPanelComponent]
})
export class AppPanelsModule {}
