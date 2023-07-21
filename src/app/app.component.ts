import { Component, ElementRef, Renderer2, ViewChild, HostListener } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { userAgent } from '@igo2/utils';
import {
  LanguageService,
  ConfigService,
  MessageService,
  StorageService
} from '@igo2/core';
import { AuthOptions } from '@igo2/auth';
import { PwaService } from './services/pwa.service';
import { Option } from './pages/filters/simple-filters.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Workspace } from '@igo2/common';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { MapState, WorkspaceState } from '@igo2/integration';
import { EditionWorkspace, Feature, FeatureWorkspace, WfsWorkspace } from '@igo2/geo';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @HostListener('window:resize', ['$event'])
	onResize() {
  		this.isMobile = window.innerWidth >= 768 ? false : true;
	}

  public features: any = null;  //object: {added: Feature[]}
  public clickedEntities: Feature[] = [];

  public showSimpleFilters: boolean = false;
  public showSimpleFeatureList: boolean = false;
  public useEmbeddedVersion: boolean = false;
  public isMobile: boolean = window.innerWidth >= 768 ? false : true; //boolean to determine screen width for layout
  public authConfig: AuthOptions;
  private themeClass = 'qcca-theme';
  public hasHeader: boolean = true;
  public hasFooter: boolean = true;
  private promptEvent: any;
  public hasMenu: boolean = false;
  public workspace = undefined;
  public mobileAndHeaderState: number = -1


  @ViewChild('searchBar', { read: ElementRef, static: true })
  searchBar: ElementRef;

  constructor(
    protected languageService: LanguageService,
    private configService: ConfigService,
    private renderer: Renderer2,
    private titleService: Title,
    private metaService: Meta,
    private messageService: MessageService,
    private pwaService: PwaService,
    private storageService: StorageService,
    public workspaceState: WorkspaceState,
    private mapState: MapState,
  ) {
    this.readTitleConfig();
    this.readThemeConfig();
    this.readDescriptionConfig();

    this.detectOldBrowser();
    this.useEmbeddedVersion = this.configService.getConfig('useEmbeddedVersion') === undefined ? false : true;
    this.showSimpleFilters = this.configService.getConfig('useEmbeddedVersion.simpleFilters') === undefined ? false : true;
    this.showSimpleFeatureList = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList') === undefined ? false : true;
    this.hasHeader = this.configService.getConfig('header.hasHeader') !== undefined && this.configService.getConfig('useEmbeddedVersion') === undefined ?
      this.configService.getConfig('header.hasHeader') : false;

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

  setSelectedWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }

  setClickedEntities(features: Feature[]) {
    this.clickedEntities = features;
  }

  onListSelection(event){
    this.features = event;
  }

}
