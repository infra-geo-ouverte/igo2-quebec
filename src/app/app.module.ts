import {
  CoordinatesSearchResultFormatter,
  provideDefaultIChercheSearchResultFormatter,
  provideSearchSourceService,
  provideStoredQueriesReverseSearchSource,
  SearchService,
  StoredQueriesSearchSource
} from '@igo2/geo';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module';
import { MenuModule } from './pages/menu/menu.module';
import { StationsModule } from './pages/menu/menu-pages/stations/stations.module';

import {
  provideConfigOptions,
  IgoMessageModule,
  IgoGestureModule,
  RouteService
} from '@igo2/core';
import { IgoSpinnerModule, IgoStopPropagationModule } from '@igo2/common';
import {
  provideIChercheSearchSource,
  provideIChercheReverseSearchSource,
  provideNominatimSearchSource,
  provideCoordinatesReverseSearchSource,
  //provideILayerSearchSource,
  provideStoredQueriesSearchSource,
  provideOsrmDirectionsSource,
  provideOptionsApi,
  //provideCadastreSearchSource,
  provideStyleListOptions,
  provideDefaultCoordinatesSearchResultFormatter
} from '@igo2/geo';

import { environment } from '../environments/environment';
import { PortalModule } from './pages';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([]),
    IgoGestureModule.forRoot(),
    IgoMessageModule,
    IgoSpinnerModule,
    IgoStopPropagationModule,
    PortalModule,
    HammerModule,
    HeaderModule,
    FooterModule,
    MenuModule,
    StationsModule
  ],
  providers: [
    provideConfigOptions({
      default: environment.igo,
      path: './config/config.json'
    }),
    RouteService,
    provideCoordinatesReverseSearchSource(),
    provideIChercheSearchSource(),
    provideNominatimSearchSource(),
    provideIChercheReverseSearchSource(),
    provideStoredQueriesSearchSource(),
    StoredQueriesSearchSource,
    provideStoredQueriesReverseSearchSource(),
    provideNominatimSearchSource(),
    provideIChercheSearchSource(),
    provideIChercheReverseSearchSource(),
    provideCoordinatesReverseSearchSource(),
    //provideILayerSearchSource(),
    provideOsrmDirectionsSource(),
    provideOptionsApi(),
    //provideCadastreSearchSource(),
    CoordinatesSearchResultFormatter,
    provideDefaultCoordinatesSearchResultFormatter(),
    provideDefaultIChercheSearchResultFormatter(),
    provideSearchSourceService(),
    SearchService,
    provideStyleListOptions({
      path: './assets/list-style.json'
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
