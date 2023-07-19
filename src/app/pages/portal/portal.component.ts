import { EntitiesAllService } from './../list/listServices/entities-all.service';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';
import { map } from 'rxjs/operators';
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
  moveToOlFeatures,
  FeatureMotion,
  WMSDataSource,
  OgcFilterWriter,
  IgoOgcFilterObject,
  MapViewOptions
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
import { timeStamp } from 'console';

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
  public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
  public entitiesAll: Array<Object>;  //all entities
  public entitiesList: Array<Object>  //filtered entities
  // public activeFilters: Map<string, Option[]> = new Map();  //map that contains all active filter options by type
  // public activeFilters$: BehaviorSubject<Map<string, Option[]>> = new BehaviorSubject<Map<string, Option[]>>(new Map()));
  public simpleFiltersValue$: BehaviorSubject<object> = new BehaviorSubject(undefined);
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
    pageSizeOptions: [1, 5, 10, 20, 50, 100, 500] // The set of provided page size options to display to the user.
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
  public additionalTypes: Array<string> = []
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
      this.hasLegendButton = this.configService.getConfig('hasLegendButton') !== undefined && this.configService.getConfig('useEmbeddedVersion') === undefined ?
        this.configService.getConfig('hasLegendButton') : false;
      this.hasSideSearch = this.configService.getConfig('hasSideSearch') === undefined ? true :
        this.configService.getConfig('hasSideSearch');
      this.showSearchBar = this.configService.getConfig('searchBar.showSearchBar') !== undefined && this.configService.getConfig('useEmbeddedVersion') === undefined ?
        this.configService.getConfig('searchBar.showSearchBar') : false;
      this.hasToolbox = this.configService.getConfig('hasToolbox') === undefined ? true :
        this.configService.getConfig('hasToolbox');
      this.showMenuButton = this.configService.getConfig('showMenuButton') === undefined ? true :
      this.configService.getConfig('showMenuButton');
      this.hasExpansionPanel = this.configService.getConfig('hasExpansionPanel');
      this.showSimpleFilters = this.configService.getConfig('useEmbeddedVersion.simpleFilters') === undefined ? false : true;
      this.showSimpleFeatureList = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList') === undefined ? false : true;
      this.showMap = this.configService.getConfig('useEmbeddedVersion.showMap') === undefined ? false : this.configService.getConfig('useEmbeddedVersion.showMap');

      console.log("SHOW STATUS ", this.showSimpleFeatureList, " ", this.showSimpleFilters, " ", this.showMap);
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
      if(value === 1 && this.showSimpleFeatureList && typeof this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId') === 'string'){
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
      // this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
      // this.expansionPanelExpanded = true;

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

  //   this.queryStore.count$
  //   .pipe(pairwise())
  //   .subscribe(([prevCnt, currentCnt]) => {
  //     this.map.viewController.padding[2] = currentCnt ? 280 : 0;
  //     // on mobile. Close the toast if workspace is opened, on new query
  //     if (
  //       prevCnt === 0 &&
  //       currentCnt !== prevCnt &&
  //       this.isMobile() &&
  //       this.hasExpansionPanel &&
  //       this.expansionPanelExpanded &&
  //       this.toastPanelOpened
  //     ) {
  //       this.toastPanelOpened = false;
  //     }
  //   });
  // this.map.ol.once('rendercomplete', () => {
  //   this.readQueryParams();
  //   if (this.configService.getConfig('geolocate.activateDefault') !== undefined) {
  //     this.map.geolocationController.tracking = this.configService.getConfig('geolocate.activateDefault');
  //   }
  // });

    this.onSettingsChange$.subscribe(() => {
      this.searchState.setSearchSettingsChange();
    });

    this.searchState.selectedResult$.subscribe((result) => {
      if (result && this.isMobile()) {
        this.closeSidenav();
      }
    });

    this.workspaceState.workspaceEnabled$.next(this.hasExpansionPanel);
    //wwwwwwwwwww
    this.workspaceState.store.empty$.subscribe((workspaceEmpty) => {
      console.log("ssssssss3")

      if (!this.hasExpansionPanel) {
        return;
      }
      this.workspaceState.workspaceEnabled$.next(workspaceEmpty ? false : true);
      if (workspaceEmpty) {
        this.expansionPanelExpanded = false;
      }
      // this.updateMapBrowserClass();
    });

    // this.workspaceMaximize$$.push(this.workspaceState.workspaceMaximize$.subscribe((workspaceMaximize) => {
    //   this.workspaceMaximize$.next(workspaceMaximize);
    //   this.updateMapBrowserClass();
    // }));
    // this.workspaceMaximize$$.push(
    //   this.workspaceMaximize$.subscribe(() => this.updateMapBrowserClass())
    // );


    this.map.layers$.subscribe( layerList => {
      console.log("layerList ", layerList);
      for(let layer of layerList){
        if(layer.options.id === this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId')){
          console.log("FOUND")
          this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
          this.expansionPanelExpanded = true;
          break;
        }
      }
    });

    //wwwwwwwwww
    this.workspaceState.workspace$.subscribe((activeWks: WfsWorkspace | FeatureWorkspace | EditionWorkspace) => {
      // console.log("workspacestate")
      // console.log(activeWks)
      console.log("ssssssss1")
      console.log("TEST1 ", this.map.status$);
      console.log("TEST2 ", this.contextLoaded);

      if (activeWks) {
        // console.log("wks 5 (active wks)");
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
        // console.log("no activeWks");
        this.expansionPanelExpanded = false;
      }
    });

    // console.log("typeof: ", typeof this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
    // console.log("id: ", this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
    if (this.showSimpleFeatureList && typeof this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId') === 'string') {
      // this.workspaceFunction();
      // console.log("if entered")

      // this.workspaceState.workspace$.subscribe(ws => {
      //   if(ws !== undefined){
      //       console.log("WS SUBSCRIBE ", ws);
      //       this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
      //       this.expansionPanelExpanded = true;
      //     }
      // });

      // console.log("outside TIMEOUT!!!")
      // setTimeout(() => {
      //   console.log("inside TIMEOUT!!!")
      //   // this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
      //   // this.expansionPanelExpanded = true;
      // }, 5000);

      // setTimeout(() => {
      //   console.log("WSStore ", this.workspaceStore);
      //   console.log("WSS ", this.workspaceState)
      //   this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
      //   // console.log(this.workspaceState.workspace$.getValue())
      //   this.expansionPanelExpanded = true;
      //   if(this.workspace){
      //     console.log("workspace exists")
      //   }else{
      //     console.log("workspace doesnt exist")
      //   }
      // }, 5000);
    }

    //wwwwwwwwwwww
    this.activeWidget$$ = this.workspaceState.activeWorkspaceWidget$.subscribe(
      (widget: Widget) => {
        console.log("ssssssss2")
        if (widget !== undefined) {
          this.openToastPanelForExpansion();
          this.showToastPanelForExpansionToggle = true;
        } else {
          this.closeToastPanelForExpansion();
          this.showToastPanelForExpansionToggle = false;
        }
        console.log(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'))
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
      console.log("afService ", activeFilters);
      this.applyFilters(activeFilters);
      // this.fitFeatures();
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
      console.log("EL SERVICE ", this.entitiesList);
    });



    // RESPONSIVE BREAKPOINTS
    this.breakpoint$.subscribe(() =>
      this.breakpointChanged()
    );
  }

  // public async workspaceFunction(){
  //   await this.workspaceState.setActiveWorkspaceById(this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.layerId'));
  //   this.expansionPanelExpanded = true;
  // }

  public breakpointChanged() {
    if(this.breakpointObserver.isMatched('(min-width: 768px)')) { // this.mobileBreakPoint is used before its initialization
      this.currentBreakpoint = this.mobileBreakPoint;
      this.mobile = false;
      // console.log("mobile ", this.mobile);
    } else {
      this.mobile = true;
      // console.log("mobile ", this.mobile);
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
    console.log("selectedworkspace ", this.selectedWorkspace$.value);
    console.log("ESC ", result);
    const baseQuerySearchSource = this.getQuerySearchSource();
    const querySearchSourceArray: QuerySearchSource[] = [];

    // console.log("ESC")

    // console.log("wks 2")
    if (this.selectedWorkspace$.value instanceof WfsWorkspace || this.selectedWorkspace$.value instanceof FeatureWorkspace) {
      // console.log("wks 3")
      console.log("ESC1")

      if (!this.selectedWorkspace$.value.getLayerWksOptionTabQuery()) {
        // console.log("wks 4")
        console.log("ESC2")

        return;}
    }
    console.log("ESC9")

    if (result && result.added) {
      console.log("ESC3")

      const results = result.added.map((res) => {
        if (res?.ol?.getProperties()._featureStore.layer?.visible) {
          console.log("ESC4")

          const ol = res.ol as olFeature<OlGeometry>;
          const featureStoreLayer = res.ol.getProperties()._featureStore.layer;
          const feature = featureFromOl(ol, featureStoreLayer.map.projection, featureStoreLayer.ol);
          feature.meta.alias = this.queryService.getAllowedFieldsAndAlias(featureStoreLayer);
          feature.meta.title = this.queryService.getQueryTitle(feature, featureStoreLayer) || feature.meta.title;
          let querySearchSource = querySearchSourceArray.find((s) => s.title === feature.meta.sourceTitle);
          if (!querySearchSource) {
            console.log("ESC5")

            querySearchSource = new QuerySearchSource({title: feature.meta.sourceTitle});
            querySearchSourceArray.push(querySearchSource);
          }
          return featureToSearchResult(feature, querySearchSource);
        }
      });

      console.log("ESC6")

      const research = {
        request: of(results),
        reverse: false,
        source: baseQuerySearchSource
      };

      console.log("ESC7")

      research.request.subscribe((queryResults: SearchResult<Feature>[]) => {
        this.queryStore.load(queryResults);
      });

      console.log("ESC8")

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
    // console.log("onmapquery")
    // the event.features array contains duplicates (if you change the zoom on the map and click on a feature that is already in the list, it adds a new one - since some specific identifyer is different every time the zoom changes)
    // therefore, this part is to remove duplicates...
    console.log("onmapquery event.features before ", event.features);
    event.features = event.features.reduce((unique, item) => {
      const hasDuplicate = unique.some((existingItem) => {
        console.log("item ", JSON.stringify(item["properties"]));
        console.log("existingItem ", JSON.stringify(existingItem["properties"]));
        console.log(JSON.stringify(existingItem["properties"]) === JSON.stringify(item["properties"]));
        return JSON.stringify(existingItem["properties"]) === JSON.stringify(item["properties"]);
      });
    
      if (!hasDuplicate) {
        unique.push(item);
      }
    
      return unique;
    }, []);
    console.log("onmapquery event.features after ", event.features);
    // this.clickedEntities$.next(event.features);
    if(event.features.length > 0) this.clickedEntities$.next(event.features);
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
        // console.log("ws4")
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
    console.log("computeHomeExtentValues context ", context)
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

  private readLanguageParam(params) {
    if (params['lang']) {
      this.authService.languageForce = true;
      this.languageService.setLanguage(params['lang']);
    }
  }

  private computeZoomToExtent() {
    console.log("computeZoomToExtent")
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
    console.log("addLayerFromUrl url ", url, " name ", name, " type ", type, " version ", version, " visibility ", visibility, " zIndex ", zIndex);
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

  onFilterSelection(event: object) {
    // console.log("onFilterSelection event: ", event);
    this.simpleFiltersValue$.next(event);
  }

  // onActiveFiltersUpdate(event: Map<string, Option[]>) {
  //   console.log("change af ", event)
  //   this.activeFilters = event;
  //   // this.activeFilters$.next(event);
  // }

  zoomToSelectedFeature(features: any) {
    console.log("zoomToSelectedFeatureWks ", features);
    const featuresSelected: Array<Feature> = features["added"];
    let format = new olFormatGeoJSON();
    // console.log("ws5")
    // const featuresSelected = this.workspaceState.workspaceSelection.map(rec => (rec.entity as Feature));
    // if (featuresSelected.length === 0) {
    //   return;
    // }
    console.log("featuresSelected: ", featuresSelected);
    const olFeaturesSelected = [];
    for (const feat of featuresSelected) {
      console.log("feat.projection",  feat.projection);
      console.log("this.map.projection ", this.map.projection)
      let localOlFeature = format.readFeature(feat,
        {
          dataProjection: feat.projection,
          featureProjection: this.map.projection
        });
        olFeaturesSelected.push(localOlFeature);
    }
    console.log("OLFS ", olFeaturesSelected);
    const totalExtent = computeOlFeaturesExtent(this.map, olFeaturesSelected);
    this.map.viewController.zoomToExtent(totalExtent);

    // moveToOlFeatures(this.map, olFeaturesSelected, FeatureMotion.Zoom);
  }

  onEntitiesListUpdate(event: Array<Object>) {
    // console.log("EL UPDATE");
    this.entitiesList = event;
  }

  public filterByOgc(wmsDatasource: WMSDataSource, filterString: string) {
    // console.log("wmsDatasource ", wmsDatasource);
    const appliedFilter = new OgcFilterWriter().formatProcessedOgcFilter(filterString, wmsDatasource.options.params.LAYERS);
    // console.log("filterByOgc2 appliedFilter ", appliedFilter);
    wmsDatasource.ol.updateParams({ FILTER: appliedFilter });
  }

  public applyFilters(activeFilters: Map<string,Option[]> ) {
    // console.log("additionalProperties ", this.additionalProperties);
    // console.log("applyFilters activeFilters ", activeFilters);
    const conditions = [];
    let idArray: Array<string> = [];
    for(let category of activeFilters){
      const bundleConditions = [];
      for(let filter of category[1]){

        // If the type is from terrapi, we will find it in the additionaltypes
        // The id will be given to the condition instead of the terrAPI type, so that it can be found with filterByOgc()
        // console.log("AF filter ", filter);
        // console.log("AF additionalTypes ", this.additionalTypes);
        if(this.additionalTypes.includes(filter.type)){
          let combinedFeatures: Array<Feature> = [];
          // console.log("AF additionalProperties", this.additionalProperties)
          for(let entry of this.additionalProperties){
            for(let type of entry[1]){
              // console.log("type[0] ", type[0], " filter.type ", filter.type, " type[1] ", type[1], " filter.nom ", filter.nom)
              if(type[0] === filter.type && type[1] === filter.nom){
                // console.log("entry found ", entry)
                if(!idArray.includes(entry[0])) idArray.push(entry[0]);
              }
            }
          }
          
          // bundleConditions.push({expression: entry[0], operator: "PropertyIsEqualTo", propertyName: additionalType});
          // console.log("idArray ", idArray);
          let features: Array<Object> = this.entitiesAll.filter(element => idArray.includes(element["geometry"]["coordinates"][0] + "," + element["geometry"]["coordinates"][1]));
          // console.log("FEATURES ", features);
          // console.log("entitiesList ", this.entitiesList);
          for(let element of features){
            // console.log("ELEMENTT ", element);
            // console.log("PROPERTIES ", element["properties"]);
            Object.keys(element["properties"]).forEach(key => {
              //remove this line once the spelling mistakes are corrected... for now the faulty accents makes it not work, but in the future I will add all fields and not just the one
              //it should add ALL properties and not just the following ones checked in the condition... just there is no guarantee that there will not be any typos in the other properties
              if(key === "id"){
                let condition = {expression: element["properties"][key], operator: "PropertyIsEqualTo", propertyName: key};
                // console.log("conditionnn ", condition);
                bundleConditions.push(condition);
              }
            });
          }
          
          // console.log("bundleConditions ", bundleConditions)
        }else{
          let condition = {expression: filter.nom, operator: "PropertyIsEqualTo", propertyName: filter.type};
          // console.log("conditionnn ", condition);
          bundleConditions.push(condition);

        }
        // console.log("ActiveFilters filter ", filter);
      }
      // console.log("build bundle ", bundleConditions);
      if(bundleConditions.length >= 1){
        if (bundleConditions.length === 1) {
          conditions.push(bundleConditions[0]);
        } else {
          conditions.push({logical: "OR", filters: bundleConditions});
        }
      }
    }
    let filterQueryString = "";
    let ogcFilterWriter: OgcFilterWriter = new OgcFilterWriter();
    // console.log("conditions ", conditions);
    if (conditions.length >= 1) {
      filterQueryString = ogcFilterWriter
        .buildFilter(conditions.length === 1 ?
          conditions[0] : {logical: 'AND', filters: conditions } as IgoOgcFilterObject);
    }
    // console.log("filterQueryString ", filterQueryString);
  
    this.filterByOgc(this.map.getLayerById('dq2').dataSource as WMSDataSource, filterQueryString);
  }

  async fitFeatures() {
    console.log("FFEntitiesList ", this.entitiesList);
    if(!this.entitiesList){
      return -1;
    }
    let e = -90
    let w = 90;
    let n = -90;
    let s = 90;

    let minX: number;
    let minY: number;
    let maxX: number;
    let maxY: number;
    let centerX: number;
    let centerY: number;

    for(let feature of this.entitiesList){

      const longitude = feature["geometry"]["coordinates"][0];  //E-W
      const latitude = feature["geometry"]["coordinates"][1];   //N-S

      w = Math.min(longitude, w);
      s = Math.min(latitude, s);
      e = Math.max(longitude, e);
      n = Math.max(latitude, n);
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

    await this.terrAPICoordReformat((e + w)/2 + "," + (n + s)/2, this.map.projection).then((coords: number[]) => {
      if(coords){
			  centerX = coords[0];
        centerY = coords[1];
      }
    });

    let mapExtent: MapExtent = [minX, minY, maxX, maxY];
    let mapCenter: [number, number] = [centerX, centerY];
    console.log("current center ", this.map.getCenter());
    console.log("center ", mapCenter)
    // console.log("current extent " , this.map.getExtent());
    // console.log("new extent ", mapExtent);
    let options: MapViewOptions = {center: mapCenter};
    // console.log("options ", options);
    this.map.updateView(options);
  }

  public async terrAPICoordReformat(coord: string, projection: string): Promise<number[]> {
    let url: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/geospatial/project?loc=" + coord + "&to=" + projection;

    const response = await this.http.get<any>(url).toPromise();
    const coordinates = response.coordinates;

    return coordinates;
  }
}
