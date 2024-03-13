import { NgModule } from '@angular/core';
import { MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { IgoSpinnerModule, IgoStopPropagationModule } from '@igo2/common';
import { provideConfigOptions } from '@igo2/core/config';
import { provideRootTranslation } from '@igo2/core/language';
import { RouteService } from '@igo2/core/route';
import {
  provideCadastreSearchSource,
  provideCoordinatesReverseSearchSource,
  provideIChercheReverseSearchSource,
  provideIChercheSearchSource,
  provideNominatimSearchSource,
  provideOptionsApi,
  provideStoredQueriesSearchSource,
  provideStyleListOptions
} from '@igo2/geo';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { PortalModule } from './pages';
import { FooterModule } from './pages/footer/footer.module';
import { HeaderModule } from './pages/header/header.module';
import { MenuModule } from './pages/menu/menu.module';

export const defaultTooltipOptions: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 0,
  touchendHideDelay: 0,
  disableTooltipInteractivity: true
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([]),
    IgoSpinnerModule,
    IgoStopPropagationModule,
    PortalModule,
    HeaderModule,
    FooterModule,
    MenuModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.igo.app.pwa.enabled,
      registrationStrategy: 'registerWithDelay:5000'
    })
  ],
  providers: [
    provideConfigOptions({
      default: environment.igo,
      path: './config/config.json'
    }),
    RouteService,
    provideNominatimSearchSource(),
    provideIChercheSearchSource(),
    provideIChercheReverseSearchSource(),
    provideCoordinatesReverseSearchSource(),
    provideStoredQueriesSearchSource(),
    provideOptionsApi(),
    provideCadastreSearchSource(),
    provideRootTranslation(),
    provideStyleListOptions({
      path: './assets/list-style.json'
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
