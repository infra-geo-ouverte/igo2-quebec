import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { APP_INITIALIZER, InjectionToken, NgModule, ApplicationRef, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module';
import { MenuModule } from './pages/menu/menu.module';
import { PortalModule } from './pages/portal/portal.module';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { concatMap, first } from 'rxjs';

export const defaultTooltipOptions: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 0,
  touchendHideDelay: 0,
  disableTooltipInteractivity: true
};

import {
  provideConfigOptions,
  IgoMessageModule,
  IgoGestureModule,
  RouteService,
  LanguageService,
  ConfigService,
  ConfigOptions,
  CONFIG_OPTIONS
} from '@igo2/core';
import { IgoSpinnerModule, IgoStopPropagationModule } from '@igo2/common';
import {
  provideStyleListOptions
} from '@igo2/geo';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

export let CONFIG_LOADER = new InjectionToken<Promise<ConfigService>>('Config Loader');

function configLoader(
  configService: ConfigService,
  configOptions: ConfigOptions,
): Promise<unknown> {
  const promiseOrTrue = configService.load(configOptions);
  if (promiseOrTrue instanceof Promise) {
    return promiseOrTrue;
  }
  return Promise.resolve();
}

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
    {
      provide: CONFIG_LOADER,
      useFactory: configLoader,
      deps: [ConfigService, CONFIG_OPTIONS],
    },
    RouteService,
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
  // ensure to have the proper translations loaded once, when the app is stable.
  return () => new Promise<any>((resolve: any) => {
    applicationRef.isStable.pipe(
      first(isStable => isStable === true),
      concatMap(() => {
        const languageService = injector.get(LanguageService);
        const lang = languageService.getLanguage();
        return languageService.translate.getTranslation(lang);
      }))
      .subscribe((translations) => {
        const languageService = injector.get(LanguageService);
        const lang = languageService.getLanguage();
        languageService.translate.setTranslation(lang, translations);
        resolve();
      });
  });
}
