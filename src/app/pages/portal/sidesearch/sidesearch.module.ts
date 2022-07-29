import { IgoSearchModule, IgoSearchResultsModule } from '@igo2/geo';
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
  IgoHomeButtonModule,
  IgoActionbarModule,
  IgoContextMenuModule
} from '@igo2/common';
import { 
  IgoFeatureModule, IgoMapModule, 
  provideCadastreSearchSource, provideCoordinatesReverseSearchSource, 
  provideIChercheReverseSearchSource, provideIChercheSearchSource, provideILayerSearchSource, 
  provideNominatimSearchSource, provideStoredQueriesReverseSearchSource, provideStoredQueriesSearchSource 
} from '@igo2/geo';
import { IgoContextManagerModule } from '@igo2/context';
import { SideSearchComponent } from './sidesearch.component';
import { MatCardModule } from '@angular/material/card';
import { IgoAppSearchModule } from '@igo2/integration';

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
    IgoHomeButtonModule,
    IgoSearchModule,
    IgoSearchResultsModule,
    IgoMapModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    IgoMessageModule.forRoot(),
    IgoSearchModule.forRoot(),
    IgoAppSearchModule,
    IgoActionbarModule,
    IgoContextMenuModule,
    IgoFeatureModule,
    SideSearchComponent

  ],
  exports: [SideSearchComponent],
  providers: [
    provideCoordinatesReverseSearchSource(),
    provideCadastreSearchSource(),
    provideIChercheSearchSource(),
    provideILayerSearchSource(),
    provideNominatimSearchSource(),
    provideIChercheReverseSearchSource(),
    provideStoredQueriesSearchSource(),
    provideStoredQueriesReverseSearchSource()
  ],
  declarations: [SideSearchComponent]
})
export class AppSideSearchModule {}
