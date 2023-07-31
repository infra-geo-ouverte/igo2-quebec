import { EntitiesAllService } from './../list/listServices/entities-all.service';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  EventEmitter,
  Output,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription, BehaviorSubject, combineLatest, of } from 'rxjs';
import { debounceTime, take, skipWhile, first, distinctUntilChanged, tap } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as olProj from 'ol/proj';
import { MatPaginator } from '@angular/material/paginator';
import { AuthOptions, AuthService } from '@igo2/auth';
import { HttpClient, HttpParams } from '@angular/common/http';
import olFormatGeoJSON from 'ol/format/GeoJSON';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ObjectUtils } from '@igo2/utils';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import type { default as OlGeometry } from 'ol/geom/Geometry';
import olFeature from 'ol/Feature';

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
  DataSourceService,
  QuerySearchSource,
  SearchSource,
  featureToSearchResult,
  QueryService,
  featureFromOl,
  WMSDataSource,
  OgcFilterWriter,
  IgoOgcFilterObject
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

import { PwaService } from '../../services/pwa.service';

import {
  controlsAnimations, controlSlideX, controlSlideY
} from './portal.animation';

import { Option } from '../filters/simple-filters.interface';
import { FiltersActiveFiltersService } from '../filters/filterServices/filters-active-filters.service';
import { FilteredEntitiesService } from '../list/listServices/filtered-entities.service';
import { FiltersAdditionalTypesService } from '../filters/filterServices/filters-additional-types.service';
import { FiltersAdditionalPropertiesService } from '../filters/filterServices/filters-additional-properties.service';
import { ListEntitiesService } from '../list/listServices/list-entities-services.service';

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
  @Input() features = {added: []}; //TODO update the type later when I know what it is..
  @Output() workspaceSelected = new EventEmitter<Workspace>();
  @Output() mapQuery = new EventEmitter<Feature[]>();
  // @Output() workspaceSelected = new EventEmitter<BehaviorSubject<Workspace>>();


  public entitiesAll: Array<Feature>; //all entities
  public entitiesList: Array<Feature>; //filtered entities
  // public activeFilters: Map<string, Option[]> = new Map();  //map that contains all active filter options by type
  // public activeFilters$: BehaviorSubject<Map<string, Option[]>> = new BehaviorSubject<Map<string, Option[]>>(new Map()));
  // public simpleFiltersValue$: BehaviorSubject<object> = new BehaviorSubject(undefined);
  public clickedEntities$: BehaviorSubject<Feature[]> = new BehaviorSubject(undefined);
  public showSimpleFilters: boolean = false;
  public showSimpleFeatureList: boolean = false;
  public showMap: boolean = false;
  public showRotationButtonIfNoRotation: boolean = false;
  public hasFooter: boolean = true;
  public hasLegendButton: boolean = true;
  public hasGeolocateButton: boolean = true;
  public hasExpansionPanel: boolean = false;
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
    pageSizeOptions: [5, 10, 25, 50, 100, 500] // The set of provided page size options to display to the user.
  };
  public useEmbeddedVersion = false;
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
  public additionalProperties: Map<string, Map<string, string>> = new Map();
  public additionalTypes: Array<string> = [];
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

  get contextUri(): string {
    return this.contextState.context$?.getValue() ? this.contextState.context$.getValue().uri : undefined;
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

  get queryStore(): EntityStore<SearchResult> {
    return this.queryState.store;
  }

  constructor(
    // public cdRef: ChangeDetectorRef,
    private entitiesAllService: EntitiesAllService,
    private entitiesListService: ListEntitiesService,
    private additionalPropertiesService: FiltersAdditionalPropertiesService,
    private additionalTypesService: FiltersAdditionalTypesService,
    private activeFilterService: FiltersActiveFiltersService,
    private filteredEntitiesService: FilteredEntitiesService,
    private queryService: QueryService,
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
    private breakpointObserver: BreakpointObserver,
    private pwaService: PwaService
  ) {
      this.useEmbeddedVersion = this.configService.getConfig('useEmbeddedVersion');
      // this.entitiesAll = this.workspace.entityStore.entities$.getValue() as Array<Feature>;
      this.hasFooter = this.configService.getConfig('hasFooter') === undefined ? false :
        this.configService.getConfig('hasFooter');
      this.hasLegendButton = this.configService.getConfig('hasLegendButton') !== undefined && !this.useEmbeddedVersion ?
        this.configService.getConfig('hasLegendButton') : false;
      this.hasSideSearch = this.configService.getConfig('hasSideSearch') === undefined ? true :
        this.configService.getConfig('hasSideSearch');
      this.showSearchBar = this.configService.getConfig('searchBar.showSearchBar') !== undefined && !this.useEmbeddedVersion ?
        this.configService.getConfig('searchBar.showSearchBar') : false;
      this.hasToolbox = this.configService.getConfig('hasToolbox') === undefined ? true :
        this.configService.getConfig('hasToolbox');
      this.showMenuButton = this.configService.getConfig('showMenuButton') === undefined ? true :
      this.configService.getConfig('showMenuButton');
      this.hasExpansionPanel = this.configService.getConfig('hasExpansionPanel');
      this.showSimpleFilters = this.configService.getConfig('useEmbeddedVersion.simpleFilters') === undefined ? false : true;
      this.showSimpleFeatureList = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList') === undefined ? false : true;
      this.showMap = this.configService.getConfig('showMap') === undefined ? false : this.configService.getConfig('showMap');
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
    this.map.status$.subscribe(value => {
      const layerId = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId');
      if(value === 1 && this.showSimpleFeatureList && typeof layerId === 'string'){
        this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
        this.expansionPanelExpanded = true;
      }
    });
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
    });

    this.map.layers$.subscribe( layerList => {
      for(let layer of layerList){
        if(layer.options.id === this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId')){
          this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
          this.expansionPanelExpanded = true;
          break;
        }
      }
    });

    this.workspaceState.workspace$.subscribe((activeWks: WfsWorkspace | FeatureWorkspace | EditionWorkspace) => {
      if (activeWks) {
        this.selectedWorkspace$.next(activeWks);
        this.workspaceSelected.emit(this.selectedWorkspace$.getValue());

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

    this.activeFilterService.onEvent().subscribe(activeFilters => {
      this.applyFilters(activeFilters);
    });


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

    this.additionalPropertiesService.onEvent().subscribe(additionalProperties => this.additionalProperties = additionalProperties);
    this.additionalTypesService.onEvent().subscribe(additionalTypes => this.additionalTypes = additionalTypes);
    this.entitiesAllService.onEvent().subscribe(entitiesAll => this.entitiesAll = entitiesAll);
    this.entitiesListService.onEvent().subscribe(entitiesList => {
      this.entitiesList = entitiesList;
      // this.fitFeatures();
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

  entitySelectChange(result: { added: Feature[] }) {
    console.log("entitySelectChange ", result);
    const baseQuerySearchSource = this.getQuerySearchSource();
    const querySearchSourceArray: QuerySearchSource[] = [];

    if (this.selectedWorkspace$.value instanceof WfsWorkspace || this.selectedWorkspace$.value instanceof FeatureWorkspace) {

      if (!this.selectedWorkspace$.value.getLayerWksOptionTabQuery()) {

        return;}
    }

    if (result && result.added) {

      const results = result.added.map((res) => {
        if (res?.ol?.getProperties()._featureStore.layer?.visible) {

          const ol = res.ol as olFeature<OlGeometry>;
          const featureStoreLayer = res.ol.getProperties()._featureStore.layer;
          const feature = featureFromOl(ol, featureStoreLayer.map.projection, featureStoreLayer.ol);
          feature.meta.alias = this.queryService.getAllowedFieldsAndAlias(featureStoreLayer);
          feature.meta.title = this.queryService.getQueryTitle(feature, featureStoreLayer) || feature.meta.title;
          let querySearchSource = querySearchSourceArray.find((s) => s.title === feature.meta.sourceTitle);
          if (!querySearchSource) {

            querySearchSource = new QuerySearchSource({title: feature.meta.sourceTitle});
            querySearchSourceArray.push(querySearchSource);
          }
          return featureToSearchResult(feature, querySearchSource);
        }
      });

      const research = {
        request: of(results),
        reverse: false,
        source: baseQuerySearchSource
      };

      research.request.subscribe((queryResults: SearchResult<Feature>[]) => {
        this.queryStore.load(queryResults);
      });

    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.features && changes.features.currentValue !== null){
      this.zoomToSelectedFeature(changes.features.currentValue);
      this.entitySelectChange(changes.features.currentValue);
    }
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

  onMapQuery(event: { features: Feature[]; event: MapBrowserEvent<any> }) {
    // the event.features array contains duplicates, so they must be removed
    event.features = event.features.reduce((unique, item) => {
      const hasDuplicate = unique.some((existingItem) => {
        return JSON.stringify(existingItem["properties"]) === JSON.stringify(item["properties"]);
      });

      if (!hasDuplicate) {
        unique.push(item);
      }

      return unique;
    }, []);
    if(event.features.length > 0) this.mapQuery.emit(event.features);
    const baseQuerySearchSource = this.getQuerySearchSource();
    const querySearchSourceArray: QuerySearchSource[] = [];
    const results = event.features.map((feature: Feature) => {
      let querySearchSource = querySearchSourceArray.find(
        (s) => s.title === feature.meta.sourceTitle
      );
      if (this.getFeatureIsSameActiveWks(feature)) {
        if (this.getWksActiveOpenInResolution() && !(this.workspace as WfsWorkspace).getLayerWksOptionMapQuery()) {
          return;
        }
      }
      if (!querySearchSource) {
        querySearchSource = new QuerySearchSource({
          title: feature.meta.sourceTitle
        });
        querySearchSourceArray.push(querySearchSource);
      }
      return featureToSearchResult(feature, querySearchSource);
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

  // getToastPanelStatus() {
  //   if (this.isMobile() === true && this.toastPanelOpened === false) {
  //     if (this.sidenavOpened === false) {
  //       if (this.expansionPanelExpanded === false) {
  //         if (this.queryState.store.entities$.value.length > 0) {
  //           return 'low';
  //         }
  //       }
  //     }
  //   }
  // }

  // get toastPanelOpened(): boolean {
  //   return this._toastPanelOpened;
  // }
  // set toastPanelOpened(value: boolean) {
  //   if (value !== !this._toastPanelOpened) {
  //     return;
  //   }
  //   this._toastPanelOpened = value;
  //   this.cdRef.detectChanges();
  // }
  // private _toastPanelOpened =
  //   (this.storageService.get('toastOpened') as boolean) !== false;


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

  zoomToSelectedFeature(features: any) {
    const featuresSelected: Array<Feature> = features["added"];
    let format = new olFormatGeoJSON();

    const olFeaturesSelected = [];
    for (const feat of featuresSelected) {
      let localOlFeature = format.readFeature(feat,
        {
          dataProjection: feat.projection,
          featureProjection: this.map.projection
        });
        olFeaturesSelected.push(localOlFeature);
    }
    const totalExtent = computeOlFeaturesExtent(this.map, olFeaturesSelected);
    this.map.viewController.zoomToExtent(totalExtent);
  }

  onEntitiesListUpdate(event: Array<Feature>) {
    this.entitiesList = event;
  }

  public filterByOgc(wmsDatasource: WMSDataSource, filterString: string) {
    console.log("filterString in method ", filterString);
    const appliedFilter = new OgcFilterWriter().formatProcessedOgcFilter(filterString, wmsDatasource.options.params.LAYERS);
    console.log("appliedFilter ", appliedFilter);
    wmsDatasource.ol.updateParams({ FILTER: appliedFilter });
  }

  public async applyFilters(activeFilters: Map<string,Option[]> ) {
    console.log("entitieslist ", this.entitiesList);
    console.log("activeFilters ", activeFilters);
    const conditions = [];
    let filterQueryString = "";
    // let idArray: Array<String> = [];
    let idMap: Map<string, Array<string>> = new Map();
    let ogcFilterWriter: OgcFilterWriter = new OgcFilterWriter();
    let filterString: string;

    //initialize id map with all the additional types as keys
    console.log(this.additionalTypes);
    for(let type of this.additionalTypes) {
      idMap.set(type, []);
    }


    // the goal is to use 3 addresses, two of them for one category and 2 of them for another with 1 of them overlapping in both. 
    // this one entity should be the only one visible on the map at the end

    for(let category of activeFilters){
      const bundleConditions = [];
      for(let filter of category[1]){

        const useEqual = true;

        // if(this.additionalTypes.includes(filter.type)){

        //   if(useEqual){
        //     let idArray: Array<String> = [];
        //     //create idArray, where it stores the keys (coords) of all entities which match the requested terrapi filter
        //     this.additionalProperties.forEach((value, key) => {
        //       console.log("value ", value);
        //       console.log("key ", key);
        //       console.log("returnedval ", value.get(filter.type));
        //       if(value.get(filter.type).includes(filter.nom)) {
        //         idArray.push(key);
        //       }
        //     });
  
        //     let terrapiConditions = [];
        //     //features representing the coords found in idArray
        //     let features: Array<Feature> = this.entitiesAll.filter(element => {
        //       return idArray.includes(element["geometry"]["coordinates"].join(","));
        //     });
        //     console.log("features ", features);
        //     let tempConditions = [];
        //     for(let element of features){
        //       Object.keys(element["properties"]).forEach(key => {
        //         let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
        //         console.log("pushing condition", condition);
        //         //add all properties to the array
        //         if(!terrapiConditions.includes(condition)) terrapiConditions.push(condition);
        //       });
  
        //       //create a big filter using all properties and joining them with logical AND
        //       tempConditions.push({logical: "AND", filters: terrapiConditions});
        //       console.log("tempConditions ", tempConditions);
        //     }
  
        //     //string together all entities we want to find
        //     if(tempConditions.length >= 1){
        //       // console.log("longBundle ", tempConditions);
        //       if (tempConditions.length === 1) {
        //         bundleConditions.push(tempConditions[0]);
        //       } else {
        //         bundleConditions.push({logical: "OR", filters: tempConditions});
        //       }
        //     }
        //     // bundleConditions.push({logical: "OR", filters: tempConditions});
        //     console.log("bundleConditions!!! ", bundleConditions);
        //   }
        //   else{
        //     // If the type is from terrapi, we will find it in the additionaltypes
        //     // The id will be given to the condition instead of the terrAPI type, so that it can be found with filterByOgc()
        //     if(this.additionalTypes.includes(filter.type)){
        //       //if a unique property was set, add the terrapi types based on this. otherwise, keep displaying all entities in the map
        //       console.log("additionalType ", filter.type);
        //       for(let entry of this.additionalProperties){
        //         for(let type of entry[1]){
        //           if(type[0] === filter.type && type[1] === filter.nom){
        //             if(!idMap.get(filter.type).includes(entry[0])) {
        //               console.log("pushing id", entry);
        //               // idArray.push(entry[0]);
        //               let temp = idMap.get(filter.type);
        //               temp.push(entry[0]);
        //               idMap.set(filter.type, temp);
        //             }
        //           }
        //         }
        //       }
        //       console.log("idMap ", idMap);


        //       //key: terrapi type
        //       //val: array of entities that match it (array of coords, which are keys to the additionalProperties map)
        //       idMap.forEach((idArray, type) => {
        //         console.log("key / val ", type, " ", idArray);
        //         let features: Array<Feature> = this.entitiesAll.filter(element => {
        //           return idArray.includes(element["geometry"]["coordinates"].join(","));
        //         });
        //         console.log("features ", features);
        //         let terrapiConditions = [];
        //         for(let element of features){
        //           Object.keys(element["properties"]).forEach(key => {
        //             let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
        //             console.log("pushing condition", condition);
        //             if(!terrapiConditions.includes(condition)) terrapiConditions.push(condition);
        //           });
        //         }
        //         if(terrapiConditions.length >= 1){
        //           console.log("longBundle ", terrapiConditions);
        //           if (terrapiConditions.length === 1 && bundleConditions.length === 0) {
        //             bundleConditions.push(terrapiConditions[0]);
        //           // } else if (bundleConditions.length === 0) {
        //           //   bundleConditions.push({filters: terrapiConditions});
        //           } else {
        //             bundleConditions.push({logical: "AND", filters: terrapiConditions});
        //           }
        //         }
        //       });

        //       console.log("post-terrapi bundle conditions ", bundleConditions);
        //     }
        //   }
        // }



        if(this.additionalTypes.includes(filter.type)){

          let idArray: Array<String> = [];
          //create idArray, where it stores the keys (coords) of all entities which match the requested terrapi filter
          this.additionalProperties.forEach((value, key) => {
            console.log("value ", value);
            console.log("key ", key);
            console.log("returnedval ", value.get(filter.type));
            if(value.get(filter.type).includes(filter.nom)) {
              idArray.push(key);
            }
          });

          let features = this.entitiesAll.filter(element => {
            return idArray.includes(element["geometry"]["coordinates"].join(","));
          });
          console.log("features ", features);
          for(let element of features){
            Object.keys(element["properties"]).forEach(key => {
              //remove this line once the spelling mistakes are corrected... for now the faulty accents makes it not work,
              //but in the future I will add all fields and not just the one
              //it should add ALL properties and not just the following ones checked in the condition...
              //just there is no guarantee that there will not be any typos in the other properties
              if(key === "adressebur"){
                let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
                console.log("pushing condition", condition);
                if(!bundleConditions.includes(condition)) bundleConditions.push(condition);
              }
            });
          }

          let coordsArray: Array<number>;
          let wktGeometry: string;

          await this.getTerrAPIGeojsonToWkt(filter.type, filter.nom, this.map.projection).then((wktGeo: string) => {
            wktGeometry = wktGeo;
          });

          // console.log("coordsArray ", coordsArray);

          // // let coordsJoined = coordsArray.join(",");
          // let coordsJoined: string;
          // coordsArray.forEach(coord => {
          //   coordsJoined === undefined ? coordsJoined = coord[0] + " " + coord[1] :
          //   coordsJoined = coordsJoined = coordsJoined + "," + coord[0] + " " + coord[1];
          // });
          // console.log("coordsJoined ", coordsJoined);

          // let gmlCoordinates = "<gml:LinearRing><gml:coordinates>" + coordsJoined + "</gml:coordinates></gml:Polygon>";
          // let polygonString = "<gml:Polygon><gml:outerBoundaryIs>" +gmlCoordinates+ "</gml:LinearRing></gml:outerBoundaryIs>";
          // filterString = "filter=<Filter xmlns=\"http://www.opengis.net/ogc\"><Intersects><PropertyName>geometry</PropertyName>" + polygonString + "</Intersects></Filter>"; //missing <Filter></Filter>

          // reprendre "geometry" de default.json
          // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Intersects></Filter>';
          let condition = {operator: "Intersects", geometryName: "the_geom", wkt_geometry: wktGeometry};


          console.log("condition terrapi ", condition);

          bundleConditions.push(condition);

          // let features: Array<Feature> = this.entitiesAll.filter(element => {
          //   return idArray.includes(element["geometry"]["coordinates"].join(","));
          // });
          // console.log("features ", features);
          // for(let element of features){
          //   Object.keys(element["properties"]).forEach(key => {
          //     //remove this line once the spelling mistakes are corrected... for now the faulty accents makes it not work,
          //     //but in the future I will add all fields and not just the one
          //     //it should add ALL properties and not just the following ones checked in the condition...
          //     //just there is no guarantee that there will not be any typos in the other properties
          //     if(key === "adressebur"){
          //       let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
          //       console.log("pushing condition", condition);
          //       if(!bundleConditions.includes(condition)) bundleConditions.push(condition);
          //     }
          //   });
          // }
        }

        //below is from friday july 28th (or before)


          //the stuff above is what i was working with before friday july 28th (friday)


          // let features: Array<Feature> = this.entitiesAll.filter(element => {
          //   return idArray.includes(element["geometry"]["coordinates"].join(","));
          // });
          // console.log("features ", features);
          // for(let element of features){
          //   Object.keys(element["properties"]).forEach(key => {
          //     //remove this line once the spelling mistakes are corrected... for now the faulty accents makes it not work,
          //     //but in the future I will add all fields and not just the one
          //     //it should add ALL properties and not just the following ones checked in the condition...
          //     //just there is no guarantee that there will not be any typos in the other properties
          //     if(key === "adressebur"){
          //       let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
          //       console.log("pushing condition", condition);
          //       if(!bundleConditions.includes(condition)) bundleConditions.push(condition);
          //     }
          //   });
          // }

          // let coordsArray: Array<number>;
          // let wktGeometry: string;

          // await this.getTerrAPIGeojsonToWkt(filter.type, filter.nom, this.map.projection).then((wktGeo: string) => {
          //   wktGeometry = wktGeo;
          // });

          // console.log("coordsArray ", coordsArray);

          // // let coordsJoined = coordsArray.join(",");
          // let coordsJoined: string;
          // coordsArray.forEach(coord => {
          //   coordsJoined === undefined ? coordsJoined = coord[0] + " " + coord[1] :
          //   coordsJoined = coordsJoined = coordsJoined + "," + coord[0] + " " + coord[1];
          // });
          // console.log("coordsJoined ", coordsJoined);

          // let gmlCoordinates = "<gml:LinearRing><gml:coordinates>" + coordsJoined + "</gml:coordinates></gml:Polygon>";
          // let polygonString = "<gml:Polygon><gml:outerBoundaryIs>" +gmlCoordinates+ "</gml:LinearRing></gml:outerBoundaryIs>";
          // filterString = "filter=<Filter xmlns=\"http://www.opengis.net/ogc\"><Intersects><PropertyName>geometry</PropertyName>" + polygonString + "</Intersects></Filter>"; //missing <Filter></Filter>

          //reprendre "geometry" de default.json
          // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Intersects></Filter>';
          // let condition = {operator: "Intersects", geometryName: "the_geom", wkt_geometry: wktGeometry};


          // console.log("condition terrapi ", condition);

          // bundleConditions.push(condition);

          // let features: Array<Feature> = this.entitiesAll.filter(element => {
          //   return idArray.includes(element["geometry"]["coordinates"].join(","));
          // });
          // console.log("features ", features);
          // for(let element of features){
          //   Object.keys(element["properties"]).forEach(key => {
          //     //remove this line once the spelling mistakes are corrected... for now the faulty accents makes it not work,
          //     //but in the future I will add all fields and not just the one
          //     //it should add ALL properties and not just the following ones checked in the condition...
          //     //just there is no guarantee that there will not be any typos in the other properties
          //     if(key === "adressebur"){
          //       let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
          //       console.log("pushing condition", condition);
          //       if(!bundleConditions.includes(condition)) bundleConditions.push(condition);
          //     }
          //   });
          // }

        else {
          console.log("not additionaltype ", filter.type);
          let condition = {expression: filter.nom, operator: "PropertyIsEqualTo", propertyName: filter.type};
          console.log("conditionnn ", condition);
          bundleConditions.push(condition);
        }
        console.log("ActiveFilters filter ", filter);
      }
      // console.log("bundleConditions ", bundleConditions);

      if(bundleConditions.length >= 1){
        console.log("longBundle ", bundleConditions);
        if (bundleConditions.length === 1) {
          conditions.push(bundleConditions[0]);
        } else {
          conditions.push({logical: "OR", filters: bundleConditions});
        }
      }
      // console.log("build bundle ", bundleConditions);
    }

    console.log("conditions ", conditions);
    if (conditions.length >= 1) {
      filterQueryString = ogcFilterWriter
        .buildFilter(conditions.length === 1 ?
          conditions[0] : {logical: 'AND', filters: conditions } as IgoOgcFilterObject);
    }
    console.log("filterQueryString ", filterQueryString);
    //remove hard coded dq2 val

    // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Intersects></Filter>';
    // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Or><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Or></Intersects></Filter>';
    // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Or><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Intersects></Or></Filter>';

    // filterString = 'filter=<Filter xmlns="http://www.opengis.net/ogc"><Or><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><PropertyIsEqualTo matchCase="true"><PropertyName>nom</PropertyName><Literal>Bureau régional de la sécurité civile et de la sécurité incendie</Literal></PropertyIsEqualTo><Intersects><PropertyName>geometry</PropertyName><MultiPolygon xmlns="http://www.opengis.net/gml" srsName="EPSG:3857"><polygonMember><Polygon srsName="EPSG:3857"><exterior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8379441.158019895 5844447.897707146 -8379441.158019895 5936172.331649357 -8134842.66750733 5936172.331649357 -8134842.66750733 5844447.897707146 -8379441.158019895 5844447.897707146</posList></LinearRing></exterior><interior><LinearRing srsName="EPSG:3857"><posList srsDimension="2">-8015003 5942074 -8015003 5780349 -7792364 5780349 -7792364 5942074 -8015003 5942074</posList></LinearRing></interior></Polygon></polygonMember></MultiPolygon></Intersects></Or></Filter>'

    console.log("filterString ", filterString);

    // if(filterString){
    //   this.filterByOgc(this.map.getLayerById('dq2').dataSource as WMSDataSource, filterString);
    // }
    if(filterQueryString) {
      this.filterByOgc(this.map.getLayerById('dq2').dataSource as WMSDataSource, filterQueryString);
    }

  }

  private async getTerrAPIGeojsonToWkt(type: string, name: string, projection: string): Promise<string> {
    // let url: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/geospatial/project?loc=" + coord + "&to=" + projection;
    let url: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/" + type + "?q=" + name + "&geometry=1&crs=" + projection;

    const response = await this.http.get<any>(url).toPromise();
    let wktGeometry: string;
    // console.log("HTTP response ", response);
    for(let feature of response.features){
      if(feature.properties.nom === name){


        // wktGeometry = "MULTIPOLYGON(((-70.2342 45.2342,-70.2342 60.2342,-85.2342 60.2342,-85.2342 45.2342,-70.2342 45.2342)))";

        wktGeometry = feature.geometry.type.toUpperCase() + "(";

        for(let i = 0; i < feature.geometry.coordinates.length; i++) {
          for(let j = 0; j < feature.geometry.coordinates[i].length; j++) {
            if(j === 0 && i !== 0) wktGeometry += ", ";
            if(j === 0){
              wktGeometry += "((";
              for(let k = 0; k < feature.geometry.coordinates[i][j].length ; k++) {
                let coord = feature.geometry.coordinates[i][j][k];
                wktGeometry += coord[0] + " " + coord[1];
                if(k + 1 < feature.geometry.coordinates[i][j].length) wktGeometry += ",";
              }
              // wktGeometry += "-83.032313 58.97123";
              // wktGeometry += "coords extérieurs";
              wktGeometry += ")";
            }
            else{
              wktGeometry += ", (";
              for(let k = 0; k < feature.geometry.coordinates[i][j].length ; k++) {
                let coord = feature.geometry.coordinates[i][j][k];
                wktGeometry += coord[0] + " " + coord[1];
                if(k + 1 < feature.geometry.coordinates[i][j].length) wktGeometry += ",";
              }
              // wktGeometry += "-83.032313 58.97123";
              // wktGeometry += "coords intérieurs";
              wktGeometry += ")";
            }
          }
          wktGeometry += ")";
        }
        wktGeometry += ")";

        console.log("wktGeometry ", wktGeometry);
        return wktGeometry;
      }
    }
    return "";
  }


  async fitFeatures() {
    console.log("FFEntitiesList ", this.entitiesList);
    console.log("entitiesAll ", this.entitiesAll);
    if(!this.entitiesList){
      return -1;
    }
    let e = -90;
    let w = 90;
    let n = -90;
    let s = 90;

    let minX: number;
    let minY: number;
    let maxX: number;
    let maxY: number;
    // let centerX: number;
    // let centerY: number;

    for(let feature of this.entitiesList){

      //E-W
      const longitude = feature["geometry"]["coordinates"][0];

      //N-S
      const latitude = feature["geometry"]["coordinates"][1];
      // console.log("COORD ", feature["geometry"]["coordinates"]);

      w = Math.min(longitude, w);
      s = Math.min(latitude, s);
      e = Math.max(longitude, e);
      n = Math.max(latitude, n);
      // console.log([n,s,e,w]);

    }

    // [minx, miny, maxx, maxy]

    await this.terrAPICoordReformat(w + "," + s, this.map.projection).then((coords: number[]) => {
      if(coords){
			  minX = coords[0];
        minY = coords[1];
      }
		});
    await this.terrAPICoordReformat(e + "," + n, this.map.projection).then((coords: number[]) => {
      if(coords){
			  maxX = coords[0];
        maxY = coords[1];
      }
    });

    // await this.terrAPICoordReformat((e + w)/2 + "," + (n + s)/2, this.map.projection).then((coords: number[]) => {
    //   if(coords){
		// 	  centerX = coords[0];
    //     centerY = coords[1];
    //   }
    // });

    let mapExtent: MapExtent = [minX, minY, maxX, maxY];
    // let mapCenter: [number, number] = [centerX, centerY];
    // console.log("current extent " , this.map.getExtent());
    // console.log("new extent ", mapExtent);
    // console.log("projection ", this.map.projection);
    // console.log("zoom ", this.map.viewController.getZoom());
    this.map.viewController.zoomToExtent(mapExtent);
  }

  public async terrAPICoordReformat(coord: string, projection: string): Promise<number[]> {
    let url: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/geospatial/project?loc=" + coord + "&to=" + projection;

    const response = await this.http.get<any>(url).toPromise();
    const coordinates = response.coordinates;

    return coordinates;
  }
}
