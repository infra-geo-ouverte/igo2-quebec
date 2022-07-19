import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
    ConfigService,
    MediaService,
    Media,
    MediaOrientation,
    StorageService
  } from '@igo2/core';

  import {
    WorkspaceStore,
    Workspace
  } from '@igo2/common';

  import {
    WfsWorkspace,
    FeatureWorkspace
  } from '@igo2/geo';

import {
  IgoMap,
} from '@igo2/geo';

import {
  MapState,
  WorkspaceState,
  QueryState
} from '@igo2/integration';

import {
  expansionPanelAnimation,
  controlsAnimations,
  controlSlideX,
  controlSlideY,
  mapSlideX,
  mapSlideY
} from './portal.animation';

import { Subscription, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss'],
  animations: [
    expansionPanelAnimation(),
    controlsAnimations(),
    controlSlideX(),
    controlSlideY(),
    mapSlideX(),
    mapSlideY()
  ]
})

export class PortalComponent implements OnInit, OnDestroy {
  public showRotationButtonIfNoRotation: boolean = undefined;
  public hasFooter: boolean = undefined;
  public hasLegendButton: boolean = undefined;
  public hasGeolocateButton: boolean = undefined;
  public hasExpansionPanel: boolean = undefined;
  public workspaceNotAvailableMessage: String = 'workspace.disabled.resolution';
  public workspaceEntitySortChange$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private workspaceMaximize$$: Subscription[] = [];
  readonly workspaceMaximize$: BehaviorSubject<boolean> = new BehaviorSubject(
    this.storageService.get('workspaceMaximize') as boolean
  );
  public selectedWorkspace$: BehaviorSubject<Workspace> = new BehaviorSubject(undefined);;

  @ViewChild('mapBrowser', { read: ElementRef, static: true })
  mapBrowser: ElementRef;

  public term: string;
  public settingsChange$ = new BehaviorSubject<boolean>(undefined);
  public sidenavOpened$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  get map(): IgoMap {
    return this.mapState.map;
  }

  isMobile(): boolean {
    return this.mediaService.getMedia() === Media.Mobile;
  }
  isTablet(): boolean {
    return this.mediaService.getMedia() === Media.Tablet;
  }
  isLandscape(): boolean {
    return this.mediaService.getOrientation() === MediaOrientation.Landscape;
  }
  isPortrait(): boolean {
    return this.mediaService.getOrientation() === MediaOrientation.Portrait;
  }
  get expansionPanelExpanded(): boolean {
    return this.workspaceState.workspacePanelExpanded;
  }
  set expansionPanelExpanded(value: boolean) {
    this.workspaceState.workspacePanelExpanded = value;
  }

  get workspaceStore(): WorkspaceStore {
    return this.workspaceState.store;
  }

  get workspace(): Workspace {
    return this.workspaceState.workspace$.value;
  }

  getBaseLayersUseStaticIcon(): Boolean {
    return this.configService.getConfig('useStaticIcon');
  }

  get sidenavOpened(): boolean {
    return this.sidenavOpened$.value;
  }

  set sidenavOpened(value: boolean) {
    this.sidenavOpened$.next(value);
  }

  constructor(
    private mapState: MapState,
    private configService: ConfigService,
    public mediaService: MediaService,
    public workspaceState: WorkspaceState,
    private queryState: QueryState,
    private storageService: StorageService
  ) {
    this.showRotationButtonIfNoRotation = this.configService.getConfig('showRotationButtonIfNoRotation') === undefined ? false :
      this.configService.getConfig('showRotationButtonIfNoRotation');
    this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
      this.configService.getConfig('hasFooter');
    this.hasLegendButton = this.configService.getConfig('hasLegendButton') === undefined ? false :
      this.configService.getConfig('hasLegendButton');
    }

  ngOnInit() {
    window['IGO'] = this;
    this.hasGeolocateButton = this.configService.getConfig('hasGeolocateButton') === undefined ? true :
      this.configService.getConfig('hasGeolocateButton');

    this.map.ol.once('rendercomplete', () => {
      if (this.configService.getConfig('geolocate.activateDefault') !== undefined) {
        this.map.geolocationController.tracking = this.configService.getConfig('geolocate.activateDefault');
      }

    });

    this.workspaceState.workspaceEnabled$.next(this.hasExpansionPanel);
    this.workspaceState.store.empty$.subscribe((workspaceEmpty) => {
      if (!this.hasExpansionPanel) {
        return;
      }
      this.workspaceState.workspaceEnabled$.next(workspaceEmpty ? false : true);
      if (workspaceEmpty) {
        this.expansionPanelExpanded = false;
      }
      this.updateMapBrowserClass();
    });

    this.workspaceMaximize$$.push(this.workspaceState.workspaceMaximize$.subscribe((workspaceMaximize) => {
      this.workspaceMaximize$.next(workspaceMaximize);
      this.updateMapBrowserClass();
    }));
    this.workspaceMaximize$$.push(
      this.workspaceMaximize$.subscribe(() => this.updateMapBrowserClass())
    );

    this.workspaceState.workspace$.subscribe((activeWorkspace: WfsWorkspace | FeatureWorkspace) => {
      if (activeWorkspace) {
        this.selectedWorkspace$.next(activeWorkspace);
        this.expansionPanelExpanded = true;
      } else {
        this.expansionPanelExpanded = false;
      }
    });
  }

  ngOnDestroy() {
    this.workspaceMaximize$$.map(f => f.unsubscribe());
  }

  updateMapBrowserClass() {
    if (this.hasExpansionPanel && this.workspaceState.workspaceEnabled$.value) {
      this.mapBrowser.nativeElement.classList.add('has-expansion-panel');
    } else {
      this.mapBrowser.nativeElement.classList.remove('has-expansion-panel');
    }

    if (this.hasExpansionPanel && this.expansionPanelExpanded) {
      if (this.workspaceMaximize$.value) {
        this.mapBrowser.nativeElement.classList.add('expansion-offset-maximized');
        this.mapBrowser.nativeElement.classList.remove('expansion-offset');
      } else {
        this.mapBrowser.nativeElement.classList.add('expansion-offset');
        this.mapBrowser.nativeElement.classList.remove('expansion-offset-maximized');
      }
    } else {
      if (this.workspaceMaximize$.value) {
        this.mapBrowser.nativeElement.classList.remove('expansion-offset-maximized');
      } else {
        this.mapBrowser.nativeElement.classList.remove('expansion-offset');
      }
    }

    if (this.sidenavOpened) {
      this.mapBrowser.nativeElement.classList.add('sidenav-offset');
    } else {
      this.mapBrowser.nativeElement.classList.remove('sidenav-offset');
    }

    if (this.sidenavOpened && !this.isMobile()) {
      this.mapBrowser.nativeElement.classList.add('sidenav-offset-baselayers');
    } else {
      this.mapBrowser.nativeElement.classList.remove(
        'sidenav-offset-baselayers'
      );
    }
  }

  getBaselayersSwitcherStatus() {
    let status;
    if (this.isMobile()) {

      if (this.workspaceState.workspaceEnabled$.value) {
        if (this.expansionPanelExpanded === false) {
          if (this.queryState.store.entities$.value.length === 0) {
            status = 'secondRowFromBottom';
          } else {
            status = 'thirdRowFromBottom';
          }
        } else {
          if (this.queryState.store.entities$.value.length === 0) {
            status = 'firstRowFromBottom-expanded';
          } else {
            status = 'secondRowFromBottom-expanded';
          }
        }

      } else {
        if (this.queryState.store.entities$.value.length === 0) {
          status = 'firstRowFromBottom';
        } else {
          status = 'secondRowFromBottom';
        }
      }
    } else {
      if (this.workspaceState.workspaceEnabled$.value) {
        if (this.expansionPanelExpanded) {
          if (this.workspaceMaximize$.value) {
            status = 'firstRowFromBottom-expanded-maximized';
          } else {
            status = 'firstRowFromBottom-expanded';
          }
        } else {
          status = 'secondRowFromBottom';
        }
      } else {
        status = 'firstRowFromBottom';
      }
    }
    return status;
  }

}
