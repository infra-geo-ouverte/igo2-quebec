import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, take, skipWhile, first, distinctUntilChanged, tap } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as olProj from 'ol/proj';
import { MatPaginator } from '@angular/material/paginator';
import { AuthOptions, AuthService } from '@igo2/auth';
import { HttpClient, HttpParams } from '@angular/common/http';
import olFormatGeoJSON from 'ol/format/GeoJSON';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ObjectUtils } from '@igo2/utils';

import {
  MediaService,
  Media,
  MediaOrientation,
  ConfigService,
  LanguageService,
  MessageService,
  StorageService
  } from '@igo2/core';

  import {
    ActionbarMode,
    Workspace,
    WorkspaceStore,
    ActionStore,
    EntityStore,
    // getEntityTitle,
    Toolbox,
    Tool,
    Widget,
    EntityTablePaginatorOptions,
    EntityRecord
  } from '@igo2/common';

  import { DetailedContext } from '@igo2/context';

  import {
  FEATURE,
  Feature,
  GoogleLinks,
  LayerService,
  Research,
  SearchResult,
  SearchSourceService,
  CapabilitiesService,
  sourceCanSearch,
  sourceCanReverseSearch,
  ImportService,
  handleFileImportError,
  handleFileImportSuccess,
  WfsWorkspace,
  FeatureWorkspace,
  EditionWorkspace,
  generateIdFromSourceOptions,
  computeOlFeaturesExtent,
  addStopToStore,
  ImageLayer,
  VectorLayer,
  MapExtent,
  IgoMap,
  DataSourceService
  } from '@igo2/geo';

import {
  MapState,
  WorkspaceState,
  QueryState,
  ContextState,
  SearchState,
  ToolState,
  DirectionState
} from '@igo2/integration';

import {
  controlsAnimations, controlSlideX, controlSlideY
} from './portal.animation';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss'],
  animations: [
    controlsAnimations(),
    controlSlideX(),
    controlSlideY()
  ]
})

export class PortalComponent implements OnInit, OnDestroy {
  public showRotationButtonIfNoRotation: boolean = undefined;
  public hasFooter: boolean = true;
  public hasLegendButton: boolean = true;
  public hasGeolocateButton: boolean = true;
  public hasExpansionPanel: boolean = undefined;
  public hasToolbox: boolean = false;
  public workspaceNotAvailableMessage: String = 'workspace.disabled.resolution';
  public workspaceEntitySortChange$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private workspaceMaximize$$: Subscription[] = [];
  readonly workspaceMaximize$: BehaviorSubject<boolean> = new BehaviorSubject(
    this.storageService.get('workspaceMaximize') as boolean
  );
  public selectedWorkspace$: BehaviorSubject<Workspace> = new BehaviorSubject(undefined);;
  public hasSideSearch = true;
  public showSearchBar = true;
  public showMenuButton = true;
  public sidenavOpened$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  @ViewChild('mapBrowser', { read: ElementRef, static: true })
  mapBrowser: ElementRef;

  public term: string;
  public settingsChange$ = new BehaviorSubject<boolean>(undefined);

  getBaseLayersUseStaticIcon(): Boolean {
    return this.configService.getConfig('useStaticIcon');
  }

  public toastPanelOffsetX$: BehaviorSubject<string> = new BehaviorSubject(undefined);
  public minSearchTermLength = 2;
  public hasHomeExtentButton = false;
  public hasFeatureEmphasisOnSelection: Boolean = false;
  public workspacePaginator: MatPaginator;
  public workspaceSwitchDisabled = false;
  public paginatorOptions: EntityTablePaginatorOptions = {
    pageSize: 50, // Number of items to display on a page.
    pageSizeOptions: [1, 5, 10, 20, 50, 100, 500] // The set of provided page size options to display to the user.
  };
  public workspaceMenuClass = 'workspace-menu';

  public fullExtent = this.storageService.get('fullExtent') as boolean;

  public matDialogRef$ = new BehaviorSubject<MatDialogRef<any>>(undefined);
  public searchBarTerm = '';
  public onSettingsChange$ = new BehaviorSubject<boolean>(undefined);
  public termDefinedInUrl = false;
  public termSplitter = '|';
  public termDefinedInUrlTriggered = false;
  private addedLayers$$: Subscription[] = [];
  public forceCoordsNA = false;

  public contextMenuStore = new ActionStore([]);
  private contextMenuCoord: [number, number];

  private contextLoaded = false;
  private context$$: Subscription;
  private openSidenav$$: Subscription;
  private sidenavMediaAndOrientation$$: Subscription;

  public igoSearchPointerSummaryEnabled: boolean;

  public toastPanelForExpansionOpened = true;
  private activeWidget$$: Subscription;
  public showToastPanelForExpansionToggle = false;
  private routeParams: Params;
  public toastPanelHtmlDisplay = false;
  public mobile: boolean;
  public homeExtent: MapExtent;
  public homeCenter: [number, number];
  public homeZoom: number;
  @ViewChild('searchBar', { read: ElementRef, static: true })
  searchBar: ElementRef;

  public dialogOpened = this.dialog.getDialogById('legend-button-dialog-container');

  get map(): IgoMap {
    return this.mapState.map;
  }

  get sidenavOpened(): boolean {
    return this.sidenavOpened$.value;
  }

  set sidenavOpened(value: boolean) {
    this.sidenavOpened$.next(value);
  }

  get auth(): AuthOptions {
    return this.configService.getConfig('auth') || [];
  }

  // Responsiveness

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

  public mobileBreakPoint: string = '(min-width: 768px)';
  public Breakpoints = Breakpoints;
  public currentBreakpoint: string = '';

  get backdropShown(): boolean {
    return (
      ('(min-width: 768px)' &&
      this.sidenavOpened
    ));
  }

  get expansionPanelExpanded(): boolean {
    return this.workspaceState.workspacePanelExpanded;
  }
  set expansionPanelExpanded(value: boolean) {
    this.workspaceState.workspacePanelExpanded = value;
    if (value === true) {
      this.map.viewController.setPadding({bottom: 280});
    } else {
      this.map.viewController.setPadding({bottom: 0});
    }
  }

  get toastPanelShown(): boolean {
    return true;
  }

  get expansionPanelBackdropShown(): boolean {
    return this.expansionPanelExpanded && this.toastPanelForExpansionOpened;
  }

  get workspace(): Workspace {
    return this.workspaceState.workspace$.value;
  }

  get actionbarMode(): ActionbarMode {
    return ActionbarMode.Overlay;
  }

  get actionbarWithTitle(): boolean {
    return this.actionbarMode === ActionbarMode.Overlay;
  }

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  get searchResultsGeometryEnabled(): boolean {
    return this.searchState.searchResultsGeometryEnabled$.value;
  }

  get toolbox(): Toolbox {
    return this.toolState.toolbox;
  }

  get workspaceStore(): WorkspaceStore {
    return this.workspaceState.store;
  }

  constructor(
    private route: ActivatedRoute,
    public workspaceState: WorkspaceState,
    public authService: AuthService,
    public mediaService: MediaService,
    public layerService: LayerService,
    public dataSourceService: DataSourceService,
    public capabilitiesService: CapabilitiesService,
    private contextState: ContextState,
    private mapState: MapState,
    private searchState: SearchState,
    private queryState: QueryState,
    private toolState: ToolState,
    private searchSourceService: SearchSourceService,
    private configService: ConfigService,
    private importService: ImportService,
    private http: HttpClient,
    private languageService: LanguageService,
    private messageService: MessageService,
    public dialogWindow: MatDialog,
    private storageService: StorageService,
    private directionState: DirectionState,
    public dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {
      this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
        this.configService.getConfig('hasFooter');
      this.hasLegendButton = this.configService.getConfig('hasLegendButton') === undefined ? false :
        this.configService.getConfig('hasLegendButton');
      this.hasSideSearch = this.configService.getConfig('hasSideSearch') === undefined ? true :
        this.configService.getConfig('hasSideSearch');
      this.showSearchBar = this.configService.getConfig('showSearchBar') === undefined ? true :
        this.configService.getConfig('showSearchBar');
      this.hasToolbox = this.configService.getConfig('hasToolbox') === undefined ? true :
        this.configService.getConfig('hasToolbox');
      this.showMenuButton = this.configService.getConfig('showMenuButton') === undefined ? true :
      this.configService.getConfig('showMenuButton');
      this.hasExpansionPanel = this.configService.getConfig('hasExpansionPanel');
      this.hasHomeExtentButton =
        this.configService.getConfig('homeExtentButton') === undefined ? false : true;
      this.hasGeolocateButton = this.configService.getConfig('hasGeolocateButton') === undefined ? true :
        this.configService.getConfig('hasGeolocateButton');
      this.showRotationButtonIfNoRotation = this.configService.getConfig('showRotationButtonIfNoRotation') === undefined ? false :
        this.configService.getConfig('showRotationButtonIfNoRotation');
      this.forceCoordsNA = this.configService.getConfig('app.forceCoordsNA');
      this.hasFeatureEmphasisOnSelection = this.configService.getConfig('hasFeatureEmphasisOnSelection');
      this.igoSearchPointerSummaryEnabled = this.configService.getConfig('hasSearchPointerSummary');
      if (this.igoSearchPointerSummaryEnabled === undefined) {
        this.igoSearchPointerSummaryEnabled = this.storageService.get('searchPointerSummaryEnabled') as boolean || false;
      }
      this.mobileBreakPoint = this.configService.getConfig('mobileBreakPoint') === undefined ? "'(min-width: 768px)'" :
        this.configService.getConfig('mobileBreakPoint');
  }

  ngOnInit() {
    window['IGO'] = this;
    this.hasGeolocateButton = this.configService.getConfig('hasGeolocateButton') === undefined ? true :
      this.configService.getConfig('hasGeolocateButton');

    this.map.ol.once('rendercomplete', () => {
      this.readQueryParams();
      if (this.configService.getConfig('geolocate.activateDefault') !== undefined) {
        this.map.geolocationController.tracking = this.configService.getConfig('geolocate.activateDefault');
      }

    });

    this.searchState.searchTermSplitter$.next(this.termSplitter);

    this.authService.authenticate$.subscribe((authenticated) => {
      this.contextLoaded = false;
    });

    this.context$$ = this.contextState.context$.subscribe(
      (context: DetailedContext) => this.onChangeContext(context)
    );

    const contextActions = [{
      id: 'coordinates',
      title: 'coordinates',
      handler: () => this.searchCoordinate(this.contextMenuCoord)
    },
    {
      id: 'googleMaps',
      title: 'googleMap',
      handler: () => this.openGoogleMaps(this.contextMenuCoord)
    },
    {
      id: 'googleStreetView',
      title: 'googleStreetView',
      handler: () => this.openGoogleStreetView(this.contextMenuCoord)
    }];

    this.contextMenuStore.load(contextActions);

    this.onSettingsChange$.subscribe(() => {
      this.searchState.setSearchSettingsChange();
    });

    this.searchState.selectedResult$.subscribe((result) => {
      if (result && this.isMobile()) {
        this.closeSidenav();
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

    this.workspaceState.workspace$.subscribe((activeWks: WfsWorkspace | FeatureWorkspace | EditionWorkspace) => {
      if (activeWks) {
        this.selectedWorkspace$.next(activeWks);
        this.expansionPanelExpanded = true;

        if (activeWks.layer.options.workspace?.pageSize && activeWks.layer.options.workspace?.pageSizeOptions) {
          this.paginatorOptions = {
            pageSize: activeWks.layer.options.workspace?.pageSize,
            pageSizeOptions: activeWks.layer.options.workspace?.pageSizeOptions
          };
        } else {
          this.paginatorOptions = {
            pageSize: 50,
            pageSizeOptions: [1, 5, 10, 20, 50, 100, 500]
          };
        }
      } else {
        this.expansionPanelExpanded = false;
      }
    });

    this.activeWidget$$ = this.workspaceState.activeWorkspaceWidget$.subscribe(
      (widget: Widget) => {
        if (widget !== undefined) {
          this.openToastPanelForExpansion();
          this.showToastPanelForExpansionToggle = true;
        } else {
          this.closeToastPanelForExpansion();
          this.showToastPanelForExpansionToggle = false;
        }
      }
    );

    this.openSidenav$$ = this.toolState.openSidenav$.subscribe(
      (openSidenav: boolean) => {
        if (openSidenav) {
          this.openSidenav();
          this.toolState.openSidenav$.next(false);
        }
      }
    );

    this.sidenavMediaAndOrientation$$ =
      combineLatest([
        this.sidenavOpened$,
        this.mediaService.media$,
        this.mediaService.orientation$]
      ).pipe(
        debounceTime(50)
      ).subscribe(() => {
        this.computeToastPanelOffsetX();
      });

    // RESPONSIVE BREAKPOINTS
    this.breakpoint$.subscribe(() =>
    this.breakpointChanged()
  );
  }

  public breakpointChanged() {
    if(this.breakpointObserver.isMatched('(min-width: 768px)')) { // this.mobileBreakPoint is used before its initialization
      this.currentBreakpoint = this.mobileBreakPoint;
      this.mobile = false;
    } else {
      this.mobile = true;
    }
  }

  readonly breakpoint$ = this.breakpointObserver
  .observe(this.mobileBreakPoint)
  .pipe(
    tap(() => {}),
    distinctUntilChanged()
  );

  computeToastPanelOffsetX() {
    if (this.isMobile() || !this.isLandscape()) {
      Promise.resolve().then(() => this.toastPanelOffsetX$.next(undefined));
    } else {
      Promise.resolve().then(() => this.toastPanelOffsetX$.next(this.getToastPanelExtent()));
    }
  }

  createFeatureProperties(layer: ImageLayer | VectorLayer) {
    let properties = {};
    layer.options.sourceOptions.sourceFields.forEach(field => {
      if (!field.primary && field.visible) {
        properties[field.name] = '';
      }
    });
    return properties;
  }

  entitySortChange() {
    this.workspaceEntitySortChange$.next(true);
  }

  ngOnDestroy() {
    this.context$$.unsubscribe();
    this.activeWidget$$.unsubscribe();
    this.openSidenav$$.unsubscribe();
    this.workspaceMaximize$$.map(f => f.unsubscribe());
    this.sidenavMediaAndOrientation$$.unsubscribe();
  }

  removeFeatureFromMap() {
    this.map.searchResultsOverlay.clear();
  }

  /**
   * Cancel ongoing add layer, if any
   */
   private cancelOngoingAddLayer() {
    this.addedLayers$$.forEach((sub: Subscription) => sub.unsubscribe());
    this.addedLayers$$ = [];
  }

  onBackdropClick() {
    this.closeSidenav();
  }

  onToggleSidenavClick() {
    this.toggleSidenav();
  }

  closeToastPanelForExpansion() {
    this.toastPanelForExpansionOpened = false;
  }

  openToastPanelForExpansion() {
    this.toastPanelForExpansionOpened = true;
  }

  onSearchTermChange(term?: string) {
    if (this.routeParams?.search && term !== this.routeParams.search) {
      this.searchState.deactivateCustomFilterTermStrategy();
    }

    this.searchState.setSearchTerm(term);
    const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();
    if (termWithoutHashtag.length < 2) {
      this.onClearSearch();
      return;
    }
    this.onBeforeSearch();
  }

  onSearch(event: { research: Research; results: SearchResult[] }) {
    const results = event.results;

    const isReverseSearch = !sourceCanSearch(event.research.source);

    let enabledSources;
    if (isReverseSearch) {
      enabledSources = this.searchSourceService
        .getEnabledSources()
        .filter(sourceCanReverseSearch);
    } else {
      enabledSources = this.searchSourceService
        .getEnabledSources()
        .filter(sourceCanSearch);
    }

    const newResults = this.searchStore.entities$.value
      .filter(
        (result: SearchResult) =>
          result.source !== event.research.source &&
          enabledSources.includes(result.source)
      )
      .concat(results);
    this.searchStore.updateMany(newResults);
  }

  onSearchSettingsChange() {
    this.onSettingsChange$.next(true);
  }

  private closeSidenav() {
    this.sidenavOpened = false;
    this.map.viewController.padding[3] = 0;
  }

  private openSidenav() {
    this.sidenavOpened = true;
    this.map.viewController.padding[3] = this.isMobile() ? 0 : 400;
  }

  private toggleSidenav() {
    this.sidenavOpened ? this.closeSidenav() : this.openSidenav();
    this.computeToastPanelOffsetX();
  }

  public toolChanged(tool: Tool) {
    if (tool && tool.name === 'searchResults' && this.searchBar) {
      this.searchBar.nativeElement.getElementsByTagName('input')[0].focus();
    }
  }

  private computeHomeExtentValues(context: DetailedContext) {
    if (context?.map?.view?.homeExtent) {
      this.homeExtent = context.map.view.homeExtent.extent;
      this.homeCenter = context.map.view.homeExtent.center;
      this.homeZoom = context.map.view.homeExtent.zoom;
    } else {
      this.homeExtent = undefined;
      this.homeCenter = undefined;
      this.homeZoom = undefined;
    }

  }

  private onChangeContext(context: DetailedContext) {
    this.cancelOngoingAddLayer();
    if (context === undefined) {
      return;
    }
    if (this.workspace && !this.workspace.entityStore.empty) {
      this.workspace.entityStore.clear();
    }
    if (!this.queryState.store.empty) {
      this.queryState.store.softClear();
    }

    this.computeHomeExtentValues(context);

    this.route.queryParams.pipe(debounceTime(250)).subscribe((qParams) => {
      if (!qParams['context'] || qParams['context'] === context.uri) {
        this.readLayersQueryParams(qParams);
      }
    });

    if (this.contextLoaded) {
      const contextManager = this.toolbox.getTool('contextManager');
      const contextManagerOptions = contextManager
        ? contextManager.options
        : {};
      let toolToOpen = contextManagerOptions.toolToOpenOnContextChange;

      if (!toolToOpen) {
        const toolOrderToOpen = ['mapTools', 'map', 'mapDetails', 'mapLegend'];
        for (const toolName of toolOrderToOpen) {
          if (this.toolbox.getTool(toolName)) {
            toolToOpen = toolName;
            break;
          }
        }
      }

      if (toolToOpen) {
        this.toolbox.activateTool(toolToOpen);
      }
    }

    this.contextLoaded = true;
  }

  private onBeforeSearch() {
    if (
      !this.toolbox.activeTool$.value ||
      this.toolbox.activeTool$.value.name !== 'searchResults'
    ) {
      this.toolbox.activateTool('searchResults');
    }
    this.openSidenav();
  }

  public onClearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
  }

  onContextMenuOpen(event: { x: number; y: number }) {
    this.contextMenuCoord = this.getClickCoordinate(event) as [number, number];
  }

  private getClickCoordinate(event: { x: number; y: number }) {
    const contextmenuPoint = event;
    const boundingMapBrowser = this.mapBrowser.nativeElement.getBoundingClientRect();
    contextmenuPoint.y =
      contextmenuPoint.y -
      boundingMapBrowser.top +
      (window.scrollY || window.pageYOffset);
    contextmenuPoint.x =
      contextmenuPoint.x -
      boundingMapBrowser.left +
      (window.scrollX || window.pageXOffset);
    const pixel = [contextmenuPoint.x, contextmenuPoint.y];

    const coord = this.map.ol.getCoordinateFromPixel(pixel);
    const proj = this.map.projection;
    return olProj.transform(coord, proj, 'EPSG:4326');
  }

  private openGoogleMaps(coord: [number, number]) {
    window.open(GoogleLinks.getGoogleMapsCoordLink(coord[0], coord[1]));
  }

  private openGoogleStreetView(coord: [number, number]) {
    window.open(GoogleLinks.getGoogleStreetViewLink(coord[0], coord[1]));
  }

  searchCoordinate(coord: [number, number]) {
    this.searchBarTerm = coord.map((c) => c.toFixed(6)).join(', ');
  }

  updateMapBrowserClass() {
    const header = this.queryState.store.entities$.value.length > 0;
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

    if (
      header &&
      (this.isMobile() || this.isTablet() || this.sidenavOpened) &&
      !this.expansionPanelExpanded
    ) {
      this.mapBrowser.nativeElement.classList.add('toast-offset-attribution');
    } else {
      this.mapBrowser.nativeElement.classList.remove(
        'toast-offset-attribution'
      );
    }
  }

  getToastPanelExtent() {
    if (!this.sidenavOpened) {
      if (this.toastPanelHtmlDisplay && this.mediaService.isDesktop()) {
        return 'htmlDisplay';
      }
      if (this.fullExtent) {
        return 'fullStandard';
      } else {
        return 'standard';
      }
    } else if (this.sidenavOpened) {
      if (this.toastPanelHtmlDisplay && this.mediaService.isDesktop()) {
        return 'htmlDisplayOffsetX';
      }
      if (this.fullExtent) {
        return 'fullOffsetX';
      } else {
        return 'standardOffsetX';
      }
    }
  }

  onPointerSummaryStatusChange(value) {
    this.storageService.set('searchPointerSummaryEnabled', value);
    this.igoSearchPointerSummaryEnabled = value;
  }

  getControlsOffsetY() {
    return this.expansionPanelExpanded ?
      this.workspaceMaximize$.value ? 'firstRowFromBottom-expanded-maximized' : 'firstRowFromBottom-expanded' :
      'firstRowFromBottom';
  }

  private readQueryParams() {
    this.route.queryParams.subscribe((params) => {
      this.routeParams = params;
      this.readToolParams();
      this.readSearchParams();
      this.readFocusFirst();
      this.computeZoomToExtent();
    });
  }

  private computeZoomToExtent() {
    if (this.routeParams['zoomExtent']) {
      const extentParams = this.routeParams['zoomExtent'].split(',');
      const olExtent = olProj.transformExtent(
        extentParams,
        'EPSG:4326',
        this.map.projection
      );
      this.map.viewController.zoomToExtent(olExtent as [number, number, number, number]);
    }
  }

  private computeFocusFirst() {
    setTimeout(() => {
      const resultItem: any = document
        .getElementsByTagName('igo-search-results-item')
        .item(0);
      if (resultItem) {
        resultItem.click();
      }
    }, 1);
  }

  private readFocusFirst() {
    if (this.routeParams['sf'] === '1' && this.termDefinedInUrl) {
      const entities$$ = this.searchStore.stateView.all$()
        .pipe(
          skipWhile((entities) => entities.length === 0),
          debounceTime(500),
          take(1)
        )
        .subscribe((entities) => {
          entities$$.unsubscribe();
          if (entities.length && !this.termDefinedInUrlTriggered) {
            this.computeFocusFirst();
            this.termDefinedInUrlTriggered = true;
          }
        });
    }
  }

  private readSearchParams() {
    if (this.routeParams['search']) {
      this.termDefinedInUrl = true;
      if (this.routeParams['exactMatch'] === '1') {
        this.searchState.activateCustomFilterTermStrategy();
      }
      if (this.routeParams['search'] && !this.routeParams['zoom'] && this.routeParams['sf'] !== '1') {
        const entities$$ = this.searchStore.stateView.all$()
          .pipe(
            skipWhile((entities) => entities.length === 0),
            debounceTime(500),
            take(1)
          )
          .subscribe((entities) => {
            entities$$.unsubscribe();
            const searchResultsOlFeatures = entities
              .filter(e => e.entity.meta.dataType === FEATURE)
              .map((entity: EntityRecord<SearchResult>) =>
                new olFormatGeoJSON().readFeature(entity.entity.data, {
                  dataProjection: entity.entity.data.projection,
                  featureProjection: this.map.projection
                })
              );
            const totalExtent = computeOlFeaturesExtent(this.map, searchResultsOlFeatures);
            this.map.viewController.zoomToExtent(totalExtent);
          });
      }
      this.searchBarTerm = this.routeParams['search'];
    }
    if (this.routeParams['searchGeom'] === '1') {
      this.searchState.searchResultsGeometryEnabled$.next(true);
    }
  }

  private readToolParams() {
    if (this.routeParams['tool']) {
      this.matDialogRef$.pipe(
        skipWhile(r => r !== undefined),
        first()
      ).subscribe(matDialogOpened => {
        if (!matDialogOpened) {
          this.toolbox.activateTool(this.routeParams['tool']);
        }
      });
    }

    if (this.routeParams['sidenav'] === '1') {
      setTimeout(() => {
        this.openSidenav();
      }, 250);
    }

    if (this.routeParams['routing']) {
      let routingCoordLoaded = false;
      const stopCoords = this.routeParams['routing'].split(';');
      const routingOptions = this.routeParams['routingOptions'];
      let resultSelection: number;
      if (routingOptions) {
        resultSelection = parseInt(routingOptions.split('result:')[1], 10);
      }
      this.directionState.stopsStore.storeInitialized$
        .pipe(skipWhile(init => !init), first())
        .subscribe((init: boolean) => {
          if (init && !routingCoordLoaded) {
            routingCoordLoaded = true;
            stopCoords.map((coord, i) => {
              if (i > 1) {
                addStopToStore(this.directionState.stopsStore);
              }
            });
            setTimeout(() => {
              stopCoords.map((coord, i) => {
                const stop = this.directionState.stopsStore.all().find(e => e.position === i);
                stop.text = coord;
                stop.coordinates = coord.split(',');
                this.directionState.stopsStore.update(stop);
              });
            }, this.directionState.debounceTime * 1.25); // this delay is due to the default component debounce time
          }
        });
      // zoom to active route
      this.directionState.routesFeatureStore.count$
        .pipe(skipWhile(c => c < 1), first())
        .subscribe(c => {
          if (c >= 1) {
            this.directionState.zoomToActiveRoute$.next();
          }
        });
      // select the active route by url controls
      this.directionState.routesFeatureStore.count$
        .pipe(skipWhile(c => c < 2), first())
        .subscribe(() => {
          if (resultSelection) {
            this.directionState.routesFeatureStore.entities$.value.map(d => d.properties.active = false);
            this.directionState.routesFeatureStore.entities$.value[resultSelection].properties.active = true;
            this.directionState.zoomToActiveRoute$.next();
          }
        });
    }
  }

  private readLayersQueryParams(params: Params) {
    this.readLayersQueryParamsByType(params, 'wms');
    this.readLayersQueryParamsByType(params, 'wmts');
    this.readLayersQueryParamsByType(params, 'arcgisrest');
    this.readLayersQueryParamsByType(params, 'imagearcgisrest');
    this.readLayersQueryParamsByType(params, 'tilearcgisrest');
    this.readVectorQueryParams(params);
  }

  getQueryParam(name, url) {
    let paramValue;
    if (url.includes('?')) {
      const httpParams = new HttpParams({ fromString: url.split('?')[1] });
      paramValue = httpParams.get(name);
    }
    return paramValue;
  }

  private readLayersQueryParamsByType(params: Params, type) {
    let nameParamLayersKey;
    let urlsKey;
    switch (type) {
      case 'wms':
        if ((params['layers'] || params['wmsLayers']) && params['wmsUrl']) {
          urlsKey = 'wmsUrl';
          nameParamLayersKey = params['wmsLayers'] ? 'wmsLayers' : 'layers'; // for maintain compatibility
        }
        break;
      case 'wmts':
        if (params['wmtsLayers'] && params['wmtsUrl']) {
          urlsKey = 'wmtsUrl';
          nameParamLayersKey = 'wmtsLayers';
        }
        break;
      case 'arcgisrest':
        if (params['arcgisLayers'] && params['arcgisUrl']) {
          urlsKey = 'arcgisUrl';
          nameParamLayersKey = 'arcgisLayers';
        }
        break;
      case 'imagearcgisrest':
        if (params['iarcgisLayers'] && params['iarcgisUrl']) {
          urlsKey = 'iarcgisUrl';
          nameParamLayersKey = 'iarcgisLayers';
        }
        break;
      case 'tilearcgisrest':
        if (params['tarcgisLayers'] && params['tarcgisUrl']) {
          urlsKey = 'tarcgisUrl';
          nameParamLayersKey = 'tarcgisLayers';
        }
        break;
    }
    if (!nameParamLayersKey || !urlsKey) {
      return;
    }
    const layersByService = params[nameParamLayersKey].split('),(');
    const urls = params[urlsKey].split(',');

    let cnt = 0;
    urls.forEach((urlSrc) => {
      let url = urlSrc;
      const version =
        this.getQueryParam('VERSION', url) ||
        this.getQueryParam('version', url) ||
        undefined;
      if (version) {
        url = url.replace('VERSION=' + version, '').replace('version=' + version, '');
      }

      const currentLayersByService = this.extractLayersByService(
        layersByService[cnt]
      );
      currentLayersByService.forEach((layer) => {
        const layerFromUrl = layer.split(':igoz');
        const layerOptions = ObjectUtils.removeUndefined({
          type,
          url: url,
          layer: layerFromUrl[0],
          params: type === 'wms' ? { LAYERS: layerFromUrl[0] } : undefined
        });
        const id = generateIdFromSourceOptions(layerOptions);
        const visibility = this.computeLayerVisibilityFromUrl(params, id);
        this.addLayerFromURL(
          url,
          layerFromUrl[0],
          type,
          version,
          visibility,
          layerFromUrl[1] ? parseInt(layerFromUrl[1], 10) : undefined
        );
      });
      cnt += 1;
    });
  }

  private readVectorQueryParams(params: Params) {
    if (params['vector']) {
      const url = params['vector'] as string;
      const lastIndex = url.lastIndexOf('/');
      const fileName = url.slice(lastIndex + 1, url.length);

      this.http.get(`${url}`, { responseType: 'blob' }).subscribe((data) => {
        const file = new File([data], fileName, {
          type: data.type,
          lastModified: Date.now()
        });
        this.importService.import(file).subscribe(
          (features: Feature[]) => this.onFileImportSuccess(file, features),
          (error: Error) => this.onFileImportError(file, error)
        );
      });
    }
  }

  private onFileImportSuccess(file: File, features: Feature[]) {
    handleFileImportSuccess(
      file,
      features,
      this.map,
      this.messageService,
      this.languageService
    );
  }

  private onFileImportError(file: File, error: Error) {
    handleFileImportError(
      file,
      error,
      this.messageService,
      this.languageService
    );
  }

  private extractLayersByService(layersByService: string): any[] {
    let outLayersByService = layersByService;
    outLayersByService = outLayersByService.startsWith('(')
      ? outLayersByService.substr(1)
      : outLayersByService;
    outLayersByService = outLayersByService.endsWith(')')
      ? outLayersByService.slice(0, -1)
      : outLayersByService;
    return outLayersByService.split(',');
  }
  private addLayerFromURL(
    url: string,
    name: string,
    type: 'wms' | 'wmts' | 'arcgisrest' | 'imagearcgisrest' | 'tilearcgisrest',
    version: string,
    visibility: boolean = true,
    zIndex: number
  ) {
    if (!this.contextLoaded) {
      return;
    }
    const commonSourceOptions = {
      optionsFromCapabilities: true,
      optionsFromApi: true,
      crossOrigin: true,
      type,
      url
    };
    const arcgisClause = (type === 'arcgisrest' || type === 'imagearcgisrest' || type === 'tilearcgisrest');
    let sourceOptions = {
      version: type === 'wmts' ? '1.0.0' : undefined,
      queryable: arcgisClause ? true : false,
      queryFormat: arcgisClause ? 'esrijson' : undefined,
      layer: name
    };
    if (type === 'wms') {
      sourceOptions = { params: { LAYERS: name, VERSION: version } } as any;
    }

    sourceOptions = ObjectUtils.removeUndefined(Object.assign({}, sourceOptions, commonSourceOptions));

    this.addedLayers$$.push(
      this.layerService
        .createAsyncLayer({
          zIndex: zIndex,
          visible: visibility,
          sourceOptions
        })
        .subscribe((l) => {
          this.map.addLayer(l);
        })
    );
  }

  private computeLayerVisibilityFromUrl(
    params: Params,
    currentLayerid: string
  ): boolean {
    const queryParams = params;
    let visible = true;
    if (!queryParams || !currentLayerid) {
      return visible;
    }
    let visibleOnLayersParams = '';
    let visibleOffLayersParams = '';
    let visiblelayers: string[] = [];
    let invisiblelayers: string[] = [];
    if (queryParams['visiblelayers']) {
      visibleOnLayersParams = queryParams['visiblelayers'];
    }
    if (queryParams['invisiblelayers']) {
      visibleOffLayersParams = queryParams['invisiblelayers'];
    }

    /* This order is important because to control whichever
     the order of * param. First whe open and close everything.*/
    if (visibleOnLayersParams === '*') {
      visible = true;
    }
    if (visibleOffLayersParams === '*') {
      visible = false;
    }

    // After, managing named layer by id (context.json OR id from datasource)
    visiblelayers = visibleOnLayersParams.split(',');
    invisiblelayers = visibleOffLayersParams.split(',');
    if (visiblelayers.indexOf(currentLayerid) > -1 || visiblelayers.indexOf(currentLayerid.toString()) > -1) {
      visible = true;
    }
    if (invisiblelayers.indexOf(currentLayerid) > -1 || invisiblelayers.indexOf(currentLayerid.toString()) > -1) {
      visible = false;
    }
    return visible;
  }
}
