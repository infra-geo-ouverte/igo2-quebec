import { enableProdMode, importProvidersFrom } from '@angular/core';
import { MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
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

import { AppComponent } from './app/app.component';
import { PortalModule } from './app/pages';
import { HeaderModule } from './app/pages/header/header.module';
import { MenuModule } from './app/pages/menu/menu.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

export const defaultTooltipOptions: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 0,
  touchendHideDelay: 0,
  disableTooltipInteractivity: true
};

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      IgoSpinnerModule,
      IgoStopPropagationModule,
      PortalModule,
      HeaderModule,
      MenuModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.igo.app.pwa.enabled,
        registrationStrategy: 'registerWithDelay:5000'
      })
    ),
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
    }),
    provideAnimations(),
    provideRouter([])
  ]
}).catch((err) => console.log(err));
