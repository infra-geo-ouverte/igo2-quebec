import { createCustomElement } from '@angular/elements';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { APP_INITIALIZER, ApplicationRef, Injector, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module';
import { MenuModule } from './pages/menu/menu.module';
import {
  provideConfigOptions,
  IgoMessageModule,
  IgoGestureModule,
  RouteService,
  LanguageService
} from '@igo2/core';
import { IgoSpinnerModule, IgoStopPropagationModule } from '@igo2/common';
import {
  provideIChercheSearchSource,
  provideIChercheReverseSearchSource,
  provideCoordinatesReverseSearchSource,
  provideILayerSearchSource,
  provideOptionsApi,
  provideStyleListOptions,
  provideWorkspaceSearchSource
} from '@igo2/geo';


import { environment } from '../environments/environment';
import { PortalModule } from './pages';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { concatMap, first } from 'rxjs';

export const defaultTooltipOptions: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 0,
  touchendHideDelay: 0,
  disableTooltipInteractivity: true
};

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
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
    RouteService,
    provideIChercheSearchSource(),
    provideWorkspaceSearchSource(),
    provideIChercheReverseSearchSource(),
    provideCoordinatesReverseSearchSource(),
    provideILayerSearchSource(),
    provideOptionsApi(),
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
  entryComponents: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  public injector: Injector;
  constructor(injector: Injector) {
    this.injector = injector;
  }

  ngDoBootstrap() {
    const el = createCustomElement(AppComponent, {injector: this.injector});
    customElements.define("igo2-quebec-integrable", el);
  }
}

function appInitializerFactory(
  injector: Injector,
  applicationRef: ApplicationRef
) {
  // ensure to have the proper translations loaded once, whe the app is stable.
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
