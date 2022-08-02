import { MatCardModule } from '@angular/material/card';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IgoLanguageModule, IgoMessageModule } from '@igo2/core';
import {
  IgoPanelModule,
  IgoFlexibleModule,
  IgoToolModule,
  IgoActionbarModule,
  IgoContextMenuModule
} from '@igo2/common';
import { 
  IgoFeatureModule,
  IgoMapModule,
  IgoSearchModule,
  provideIChercheSearchSource,
  //provideILayerSearchSource,
  provideNominatimSearchSource,
  provideIChercheReverseSearchSource,
  provideCoordinatesReverseSearchSource,
  //provideCadastreSearchSource,
  provideStoredQueriesSearchSource,
  provideStoredQueriesReverseSearchSource
} from '@igo2/geo';
import { IgoContextManagerModule } from '@igo2/context';
import { IgoAppSearchModule } from '@igo2/integration';
import { SideResultComponent } from './sideresult.component';

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
    IgoFeatureModule,
    //SEARCH
    MatCardModule,
    IgoMessageModule,
    IgoMapModule,
    IgoSearchModule,
    IgoActionbarModule,
    IgoContextMenuModule,
    IgoAppSearchModule
  ],
  exports: [SideResultComponent ],
  //SEARCH
  providers: [
    provideCoordinatesReverseSearchSource(),
    //provideCadastreSearchSource(),
    provideIChercheSearchSource(),
    //provideILayerSearchSource(),
    provideNominatimSearchSource(),
    provideIChercheReverseSearchSource(),
    provideStoredQueriesSearchSource(),
    provideStoredQueriesReverseSearchSource()
  ],
  declarations: [SideResultComponent]
})
export class AppSideResultModule {}
