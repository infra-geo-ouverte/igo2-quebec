import {
  APP_INITIALIZER,
  ApplicationRef,
  Injector,
  NgModule
} from '@angular/core';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions
} from '@angular/material/tooltip';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { IgoSpinnerModule, IgoStopPropagationModule } from '@igo2/common';
import {
  IgoGestureModule,
  IgoMessageModule,
  LanguageService,
  RouteService,
  provideConfigOptions
} from '@igo2/core';
import {
  CoordinatesSearchResultFormatter,
  IChercheSearchSource,
  SearchService,
  provideCoordinatesReverseSearchSource,
  provideDefaultCoordinatesSearchResultFormatter,
  provideDefaultIChercheSearchResultFormatter,
  provideIChercheReverseSearchSource,
  provideIChercheSearchSource,
  provideILayerSearchSource,
  provideNominatimSearchSource,
  provideOptionsApi,
  provideOsrmDirectionsSource,
  provideSearchSourceService,
  provideStyleListOptions,
  provideWorkspaceSearchSource
} from '@igo2/geo';

import { concatMap, first } from 'rxjs';

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
    IgoGestureModule.forRoot(),
    IgoMessageModule,
    IgoSpinnerModule,
    IgoStopPropagationModule,
    PortalModule,
    HammerModule,
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
    provideCoordinatesReverseSearchSource(),
    provideIChercheSearchSource(),
    provideNominatimSearchSource(),
    provideIChercheReverseSearchSource(),
    provideILayerSearchSource(),
    provideOsrmDirectionsSource(),
    provideOptionsApi(),
    CoordinatesSearchResultFormatter,
    provideDefaultCoordinatesSearchResultFormatter(),
    provideDefaultIChercheSearchResultFormatter(),
    provideSearchSourceService(),
    SearchService,
    IChercheSearchSource,
    provideStyleListOptions({
      path: './assets/list-style.json'
    }),
    RouteService,
    provideWorkspaceSearchSource(),
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [Injector, ApplicationRef],
      multi: true
    },
    provideStyleListOptions({
      path: './assets/list-style.json'
    }),
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: defaultTooltipOptions }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

function appInitializerFactory(
  injector: Injector,
  applicationRef: ApplicationRef
) {
  // ensure to have the proper translations loaded once, whe the app is stable.
  return () =>
    new Promise<any>((resolve: any) => {
      applicationRef.isStable
        .pipe(
          first((isStable) => isStable === true),
          concatMap(() => {
            const languageService = injector.get(LanguageService);
            const lang = languageService.getLanguage();
            return languageService.translate.getTranslation(lang);
          })
        )
        .subscribe((translations) => {
          const languageService = injector.get(LanguageService);
          const lang = languageService.getLanguage();
          languageService.translate.setTranslation(lang, translations);
          resolve();
        });
    });
}
