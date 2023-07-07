import { Component, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { userAgent } from '@igo2/utils';
import {
  LanguageService,
  ConfigService,
  MessageService
} from '@igo2/core';
import { AuthOptions } from '@igo2/auth';
import { PwaService } from './services/pwa.service';
import { Option } from './pages/filters/simple-filters.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @HostListener('window:resize', ['$event'])
	onResize() {
  		this.isMobile = window.innerWidth >= 768 ? false : true;
      // console.log("isMobile: ", this.isMobile);
	}

  // public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
  // public entitiesAll: Array<Object>;  //all entities
  // public entitiesList: Array<Object>  //filtered entities
  // public simpleFiltersValue$: BehaviorSubject<object> = new BehaviorSubject(undefined);

  public isMobile: boolean = window.innerWidth >= 768 ? false : true; //boolean to determine screen width for layout
  public authConfig: AuthOptions;
  private themeClass = 'qcca-theme';
  public hasHeader: boolean = true;
  public hasFooter: boolean = true;
  private promptEvent: any;
  public hasMenu: boolean = false;

  @ViewChild('searchBar', { read: ElementRef, static: true })
  searchBar: ElementRef;

  constructor(
    protected languageService: LanguageService,
    private configService: ConfigService,
    private renderer: Renderer2,
    private titleService: Title,
    private metaService: Meta,
    private messageService: MessageService,
    private pwaService: PwaService
  ) {
    this.readTitleConfig();
    this.readThemeConfig();
    this.readDescriptionConfig();

    this.detectOldBrowser();

    this.hasHeader = this.configService.getConfig('header.hasHeader') !== undefined && this.configService.getConfig('useEmbeddedVersion') === undefined ?
      this.configService.getConfig('header.hasHeader') : false;
    // console.log("hasHeader: ", this.hasHeader);

    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
      this.configService.getConfig('hasFooter');

    this.hasMenu = this.configService.getConfig('hasMenu') === undefined ? false :
      this.configService.getConfig('hasMenu');

    this.setManifest();
    this.installPrompt();
    this.pwaService.checkForUpdates();
  }

  private readTitleConfig() {
    this.languageService.translate.get(this.configService.getConfig('title')).subscribe(title => {
      if (title) {
        this.titleService.setTitle(title);
        this.metaService.addTag({ name: 'title', content: title });
      }
    });
  }

  private setManifest() {
    const appConfig = this.configService.getConfig('app');
    if (appConfig?.install?.enabled) {
      const manifestPath = appConfig.install.manifestPath || 'manifest.webmanifest';
      document.querySelector('#igoManifestByConfig').setAttribute('href', manifestPath);
    }
  }

  private installPrompt() {
    const appConfig = this.configService.getConfig('app');
    if (appConfig?.install?.enabled && appConfig?.install?.promote) {
      if (userAgent.getOSName() !== 'iOS') {
        window.addEventListener('beforeinstallprompt', (event: any) => {
          event.preventDefault();
          this.promptEvent = event;
          window.addEventListener('click', () => {
            setTimeout(() => {
              this.promptEvent.prompt();
              this.promptEvent = undefined;
            }, 750);
          }, { once: true });
        }, { once: true });
      }
    }
  }

  private readThemeConfig() {
    const theme = this.configService.getConfig('theme') || this.themeClass;
    if (theme) {
      this.renderer.addClass(document.body, theme);
    }
  }

  private readDescriptionConfig() {
    const description = this.configService.getConfig('description');
    if (description) {
      this.metaService.addTag({ name: 'description', content: description });
    }
  }

  private detectOldBrowser() {
    const oldBrowser = userAgent.satisfies({
      ie: '<=11',
      chrome: '<64',
      firefox: '<60',
      safari: '<=11'
    });

    if (oldBrowser) {
      this.messageService.alert('oldBrowser.message', 'oldBrowser.title', {
        timeOut: 15000
      });
    }
  }
}
