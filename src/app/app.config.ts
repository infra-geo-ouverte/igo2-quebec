import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading
} from '@angular/router';

import { provideIcon } from '@igo2/common/icon';
import { IgoCoreModule } from '@igo2/core';
import { provideConfig } from '@igo2/core/config';
import { provideTranslation } from '@igo2/core/language';
import { provideNavigationTitle } from '@igo2/sdg';

import { environment } from '../environments';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule, IgoCoreModule),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideConfig({
      default: { ...environment, ...environment.igo },
      path: './config/config.json'
    }),
    provideTranslation(),
    provideNavigationTitle(),
    provideIcon()
  ]
};
