import {
  Component,
  OnInit,
  AfterContentInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription, BehaviorSubject, of, skip } from 'rxjs';
import { debounceTime, take, skipWhile, distinctUntilChanged, tap } from 'rxjs/operators';
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
  StorageService,
  AnalyticsService
  } from '@igo2/core';

  import {
    ActionbarMode,
    Workspace,
    WorkspaceStore,
    ActionStore,
    EntityStore,
    getEntityTitle,
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
  generateIdFromSourceOptions,
  computeOlFeaturesExtent,
  ImageLayer,
  VectorLayer,
  MapExtent,
  IgoMap,
  DataSourceService,
  SearchSource,
  QuerySearchSource,
  featureToSearchResult,
  QueryService,
  Layer,
  MapService
  } from '@igo2/geo';

import {
  MapState,
  WorkspaceState,
  QueryState,
  ContextState,
  DirectionState
} from '@igo2/integration';

import { SearchState } from './panels/search-results-tool/search.state';

import { PwaService } from '../../services/pwa.service';

import {
  controlsAnimations, controlSlideX, controlSlideY
} from './portal.animation';
import { MapBrowserEvent } from 'ol';

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

export class PortalComponent implements OnInit, AfterContentInit, OnDestroy {
  public showRotationButtonIfNoRotation: boolean = undefined;
  public hasFooter: boolean = true;
  public hasLegendButton: boolean = true;
  public hasGeolocateButton: boolean = true;
  public workspaceNotAvailableMessage: String = 'workspace.disabled.resolution';
  public workspaceEntitySortChange$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private workspaceMaximize$$: Subscription[] = [];
  readonly workspaceMaximize$: BehaviorSubject<boolean> = new BehaviorSubject(
    this.storageService.get('workspaceMaximize') as boolean
  );
  public selectedWorkspace$: BehaviorSubject<Workspace> = new BehaviorSubject(undefined);;
  public hasSideSearch = true;
  public showSearchBar = true;
  @ViewChild('mapBrowser', { read: ElementRef, static: true })
  mapBrowser: ElementRef;
  public legendPanelOpened = false;
  public legendDialogOpened = false;
  public settingsChange$ = new BehaviorSubject<boolean>(undefined);

  getBaseLayersUseStaticIcon(): Boolean {
    return this.configService.getConfig('useStaticIcon');
  }
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
  private layers$$: Subscription;
  public forceCoordsNA = false;

  public contextMenuStore = new ActionStore([]);
  private contextMenuCoord: [number, number];

  private contextLoaded = false;
  private context$$: Subscription;
  private openPanels$$: Subscription;
  private sidenavMediaAndOrientation$$: Subscription;
  private searchTerm$$: Subscription;

  public igoSearchPointerSummaryEnabled: boolean;

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

  get auth(): AuthOptions {
    return this.configService.getConfig('auth') || [];
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

  public mobileBreakPoint: string = '(min-width: 768px)';
  public Breakpoints = Breakpoints;
  public currentBreakpoint: string = '';

  get backdropShown(): boolean {
    return (
      ('(min-width: 768px)' &&
      this.panelOpenState
    ));
  }

  get expansionPanelExpanded(): boolean {
    return this.workspaceState.workspacePanelExpanded;
  }
  set expansionPanelExpanded(value: boolean) {
    this.workspaceState.workspacePanelExpanded = value;
    if (value) {
      this.map.viewController.setPadding({bottom: 280});
    } else {
      this.map.viewController.setPadding({bottom: 0});
    }
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

  get workspaceStore(): WorkspaceStore {
    return this.workspaceState.store;
  }

  get queryStore(): EntityStore<SearchResult> { //FeatureInfo
    return this.queryState.store;
  }
  public panelOpenState = false;
  public mapQueryClick = false;
  public searchInit = false;

  public mapLayersShownInLegend: Layer[];
  public legendInPanel: boolean;
  public legendButtonTooltip = this.languageService.translate.instant('legend.open');

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
    private mapService: MapService,
    private searchState: SearchState,
    private queryState: QueryState,
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
    public queryService: QueryService,
    private breakpointObserver: BreakpointObserver,
    private pwaService: PwaService,
    private analyticsService: AnalyticsService
  ) {
      this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
        this.configService.getConfig('hasFooter');
      this.hasLegendButton = this.configService.getConfig('hasLegendButton') === undefined ? false :
        this.configService.getConfig('hasLegendButton');
      this.hasSideSearch = this.configService.getConfig('hasSideSearch') === undefined ? true :
        this.configService.getConfig('hasSideSearch');
        this.showSearchBar = this.configService.getConfig('searchBar.showSearchBar') === undefined ? true :
        this.configService.getConfig('searchBar.showSearchBar');
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
      this.hasHomeExtentButton = this.configService.getConfig('homeExtentButton') === undefined ? false : true;
      this.legendInPanel = this.configService.getConfig('legendInPanel') === undefined ? true :
        this.configService.getConfig('legendInPanel');
  }

  ngOnInit() {
    this.queryService.defaultFeatureCount = 1;
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

    this.route.queryParams.subscribe((params) => {
      this.readLanguageParam(params);
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

    this.searchState.selectedResult$.subscribe((result) => {
      if (result && this.isMobile()) {
        this.closePanels();
      }
    });

    this.searchTerm$$ = this.searchState.searchTerm$.pipe(skip(1)).subscribe((searchTerm: string) => {
      if (searchTerm !== undefined && searchTerm !== null) {
        this.analyticsService.trackSearch(searchTerm, this.searchState.store.count);
      }
    });

    this.queryService.defaultFeatureCount = 1;

    this.queryStore.entities$
    .subscribe(
      (entities) => {
      if (entities.length > 0) {
        this.openPanelonQuery();
      }
    });

    this.breakpoint$.subscribe(() =>
    this.breakpointChanged()
    );
  }

  ngAfterContentInit(): void {
    this.map.viewController.setInitialState();
  }

  toggleDialogLegend(){
    if (!this.legendDialogOpened) {
      this.legendDialogOpened = true;
    }
  }

  toggleLegend(){
    if (this.legendInPanel && !this.mobile){
      if (!this.legendPanelOpened) {
        this.legendButtonTooltip = this.languageService.translate.instant('legend.close');
        this.openPanelLegend();
        if (this.searchInit){
          this.clearSearch();
          this.openPanels();
        }
        if (this.mapQueryClick){
          this.onClearQuery();
          this.mapQueryClick = false;
          this.openPanels();
        }
      } else {
        this.legendButtonTooltip = this.languageService.translate.instant('legend.open');
        this.closePanelLegend();
      }
    }
    else {
      if (!this.legendDialogOpened) {
        this.legendDialogOpened = true;
      }
    }
  }

  panelOpened(event) {
    this.panelOpenState = event;
  }

  mapQuery(event) {
    this.mapQueryClick = event;
  }

  closePanelLegend(){
    this.legendPanelOpened = false;
    this.closePanels();
    this.map.propertyChange$.unsubscribe;
  }

  openPanelLegend(){
    this.legendPanelOpened = true;
    this.openPanels();
    this.map.propertyChange$.subscribe(() => {
      this.mapLayersShownInLegend = this.map.layers.filter(layer => (
        layer.showInLayerList !== false
      ));
    });
  }

  public breakpointChanged() {
    if(this.breakpointObserver.isMatched('(min-width: 768px)')) {
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

  /*
  private initSW() {
    const dataDownload = this.configService.getConfig('pwa.dataDownload');
    if ('serviceWorker' in navigator && dataDownload) {
      let downloadMessage;
      let currentVersion;
      const dataLoadSource = this.storageService.get('dataLoadSource');
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker Ready');
        this.http.get('ngsw.json').pipe(
          concatMap((ngsw: any) => {
            const datas$ = [];
            let hasDataInDataDir: boolean = false;
            if (ngsw) {
              // IF FILE NOT IN THIS LIST... DELETE?
              currentVersion = ngsw.appData.version;
              const cachedDataVersion = this.storageService.get('cachedDataVersion');
              if (currentVersion !== cachedDataVersion && dataLoadSource === 'pending') {
                this.pwaService.updates.checkForUpdate();
              }
              if (dataLoadSource === 'newVersion' || !dataLoadSource) {
                ((ngsw as any).assetGroups as any).map((assetGroup) => {
                  if (assetGroup.name === 'contexts') {
                    const elemToDownload = assetGroup.urls.concat(assetGroup.files).filter(f => f);
                    elemToDownload.map((url, i) => datas$.push(this.http.get(url).pipe(delay(750))));
                  }
                });
                if (hasDataInDataDir) {
                  const message = this.languageService.translate.instant('pwa.data-download-start');
                  downloadMessage = this.messageService
                    .info(message, undefined, { disableTimeOut: true, progressBar: false, closeButton: true, tapToDismiss: false });
                  this.storageService.set('cachedDataVersion', currentVersion);
                }
                return zip(...datas$);
              }

            }
            return zip(...datas$);
          })
        )
          .pipe(delay(1000))
          .subscribe(() => {
            if (downloadMessage) {
              this.messageService.remove((downloadMessage as any).toastId);
              const message = this.languageService.translate.instant('pwa.data-download-completed');
              this.messageService.success(message, undefined, { timeOut: 40000 });
              if (currentVersion) {
                this.storageService.set('dataLoadSource', 'pending');
                this.storageService.set('cachedDataVersion', currentVersion);
              }
            }
          });

      });
    }
  }*/

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
    this.workspaceMaximize$$.map(f => f.unsubscribe());
    this.layers$$?.unsubscribe();
    this.searchTerm$$.unsubscribe();
  }

  private getQuerySearchSource(): SearchSource {
    return this.searchSourceService
      .getSources()
      .find(
        (searchSource: SearchSource) =>
          searchSource instanceof QuerySearchSource
      );
  }

  private getFeatureIsSameActiveWks(feature: Feature): boolean {
    if (this.workspace) {
      const featureTitle = feature.meta.sourceTitle;
      const wksTitle = this.workspace.title;
      if (wksTitle === featureTitle) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  private getWksActiveOpenInResolution(): boolean {
    if(this.workspace) {
      const activeWks = this.workspace as WfsWorkspace;
      if(activeWks.active && activeWks.inResolutionRange$.value && this.workspaceState.workspacePanelExpanded) {
        return true;
      }
    }
    return false;
   }

  onMapQuery(event: { features: Feature[]; event: MapBrowserEvent<any> }) {
    if(this.configService.getConfig('queryOnlyOne')){
      event.features = [event.features[0]];
      this.map.queryResultsOverlay.clear(); // to avoid double-selection in the map
    }
    const baseQuerySearchSource = this.getQuerySearchSource();
    const querySearchSourceArray: QuerySearchSource[] = [];
    if (event.features) {
      const results = event.features.map((feature: Feature) => {
        if (feature) {
          if (this.mapQueryClick) {
            this.onClearQuery();
          }
          this.clearSearch();
          this.openPanelonQuery();
          let querySearchSource = querySearchSourceArray.find(
            (s) => s.title === feature.meta.sourceTitle
          );
          if (this.getFeatureIsSameActiveWks(feature)) {
            if (this.getWksActiveOpenInResolution() && !(this.workspace as WfsWorkspace).getLayerWksOptionMapQuery()) {
              return;
            }
          }
          if (querySearchSource) {
            this.onClearQuery();
            this.openPanelonQuery();
            this.mapQueryClick = true;
          }
          if (!querySearchSource) {
            querySearchSource = new QuerySearchSource({
              title: feature.meta.sourceTitle
            });
            querySearchSourceArray.push(querySearchSource);
          }
            return featureToSearchResult(feature, querySearchSource);
        } else {
          this.mapQueryClick = false;
          if (!this.searchInit && !this.legendPanelOpened && !this.mobile){ // in desktop keep legend opened if user clicks on the map
            this.panelOpenState = false;
          }
          if (!this.searchInit && this.mobile){ // mobile mode, close legend when user click on the map
            this.panelOpenState = false;
          }
        }
      });

      const filteredResults = results.filter(x => x !== undefined);
      const research = {
        request: of(filteredResults),
        reverse: false,
        source: baseQuerySearchSource
      };
      research.request.subscribe((queryResults: SearchResult<Feature>[]) => {
        this.queryStore.load(queryResults);
      });
    } else {
      this.mapQueryClick = false;
      this.panelOpenState = false;
    }
  }

  /**
   * Cancel ongoing add layer, if any
   */
   private cancelOngoingAddLayer() {
    this.addedLayers$$.forEach((sub: Subscription) => sub.unsubscribe());
    this.addedLayers$$ = [];
  }

  onBackdropClick() {
    this.closePanels();
    this.mapQueryClick = false;
  }

  onSearchTermChange(term?: string) {
    if(this.mobile) {this.panelOpenState = true;}
    if (this.routeParams?.search && term !== this.routeParams.search) {
      this.searchState.deactivateCustomFilterTermStrategy();
    }

    this.searchState.setSearchTerm(term);
    const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();
    if (termWithoutHashtag.length < 2) {
      if(this.mobile) {this.panelOpenState = true;}
      this.clearSearch();
      return;
    }
    this.onBeforeSearch();
  }

  clearSearchbarterm(event){
    this.searchBarTerm = event;
  }

  onSearch(event: { research: Research; results: SearchResult[] }) {
    this.searchInit = true;
    this.legendPanelOpened = false;
    this.panelOpenState = true;
    if (this.mapQueryClick) {
      this.onClearQuery();
      this.mapQueryClick = false;
      this.panelOpenState = true;
    }
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

  private closePanels() {
    if (!this.mapQueryClick && !this.searchInit && !this.legendPanelOpened){
      this.panelOpenState = false;
    }
  }

  private openPanels() {
    this.panelOpenState = true;
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

    this.contextLoaded = true;
  }

  private onBeforeSearch() {
    this.openPanels();
  }

  clearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
    this.searchInit = false;
    this.searchBarTerm = ''; // the searchbarterm doesn't clear up
    this.searchState.setSearchTerm('');
  }

  closePanelOnCloseQuery(){
    this.mapQueryClick = false;
    if (this.searchInit || this.legendPanelOpened) {
      this.openPanels(); // to prevent the panel to close when click searchbar after query
    }
  }

  openPanelonQuery(){
    this.mapQueryClick = true;
    this.openPanels;
    this.legendPanelOpened = false;
    this.clearSearch();
  }

  onClearQuery(){
    this.queryState.store.clear(); // clears the info panel
    this.queryState.store.softClear(); // clears the info panel
    this.map.queryResultsOverlay.clear(); // to avoid double-selection in the map
  }

  getTitle(result: SearchResult) {
    return getEntityTitle(result);
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

  onPointerSummaryStatusChange(value) {
    this.storageService.set('searchPointerSummaryEnabled', value);
    this.igoSearchPointerSummaryEnabled = value;
  }

  private readQueryParams() {
    this.route.queryParams.subscribe((params) => {
      this.routeParams = params;
      this.readSearchParams();
      this.readFocusFirst();
      this.computeZoomToExtent();
    });
  }

  private readLanguageParam(params) {
    if (params['lang']) {
      this.authService.languageForce = true;
      this.languageService.setLanguage(params['lang']);
    }
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

  getControlsOffsetY() {
    return this.expansionPanelExpanded ?
      this.workspaceMaximize$.value ? 'firstRowFromBottom-expanded-maximized' : 'firstRowFromBottom-expanded' :
      'firstRowFromBottom';
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
          debounceTime(1000),
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
      this.contextState.context$.value.uri,
      this.messageService,
      this.layerService
    );
  }

  private onFileImportError(file: File, error: Error) {
    handleFileImportError(
      file,
      error,
      this.messageService
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
