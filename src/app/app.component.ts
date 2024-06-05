import { DOCUMENT, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  Signal,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import { HeaderComponent, NavigationComponent } from '@igo2/sdg';
import { DomUtils } from '@igo2/utils';

import { delay, first } from 'rxjs';

import { EnvironmentOptions } from '../environments/environnement.interface';
import { routes } from './app.routes';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NavigationComponent,
    HeaderComponent,
    RouterOutlet,
    MatButtonModule,
    MatIconModule
  ]
})
export class AppComponent implements OnInit {
  public hasHeader: boolean;
  public hasFooter: boolean;
  public hasMenu: boolean = false;
  config: EnvironmentOptions;
  routes = routes.filter((route) => route.redirectTo == null);

  @ViewChild('searchBar', { read: ElementRef, static: true })
  searchBar: ElementRef;

  get isHandset(): Signal<boolean> {
    return this.appService.isHandset;
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    protected languageService: LanguageService,
    private configService: ConfigService,
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private appService: AppService,
    iconRegistry: MatIconRegistry
  ) {
    iconRegistry.registerFontClassAlias('Linearicons-Free', 'lnr');

    this.config = this.configService.getConfigs();

    this.readTitleConfig();
    this.readDescriptionConfig();

    this.hasHeader = this.configService.getConfig('header.hasHeader', false);
    this.hasFooter = this.configService.getConfig('hasFooter', false);
    this.hasMenu = this.configService.getConfig('hasMenu', false);
  }

  ngOnInit(): void {
    this.handleSplashScreen();
  }

  private handleSplashScreen(): void {
    this.router.events
      .pipe(
        first((events) => events instanceof NavigationEnd),
        delay(500)
      )
      .subscribe(() => {
        this._removeSplashScreen();
      });
  }

  private _removeSplashScreen(): void {
    const intro = this.document.getElementById('splash-screen');
    if (!intro) {
      return;
    }
    intro.classList.add('is-destroying');

    const destroyingAnimationTime = 300;
    const stylesheet = this.document.getElementById('splash-screen-stylesheet');

    setTimeout(() => {
      DomUtils.remove(intro);
      DomUtils.remove(stylesheet);
    }, destroyingAnimationTime);
  }

  private readTitleConfig() {
    this.languageService.translate
      .get(this.configService.getConfig('title'))
      .subscribe((title) => {
        if (title) {
          this.titleService.setTitle(title);
          this.metaService.addTag({ name: 'title', content: title });
        }
      });
  }

  private readDescriptionConfig() {
    const description = this.configService.getConfig('description');
    if (description) {
      this.metaService.addTag({ name: 'description', content: description });
    }
  }
}
