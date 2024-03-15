import {
  BreakpointObserver,
  BreakpointState,
  Breakpoints
} from '@angular/cdk/layout';
import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AfterContentInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  MatSidenavContainer,
  MatSidenavContent
} from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Params } from '@angular/router';

import { EntityRecord, EntityStore } from '@igo2/common';
import {
  DetailedContext,
  LayerContextDirective,
  MapContextDirective
} from '@igo2/context';
import { AnalyticsService } from '@igo2/core/analytics';
import { ConfigService } from '@igo2/core/config';
import { LanguageService } from '@igo2/core/language';
import { Media, MediaService } from '@igo2/core/media';
import { MessageService } from '@igo2/core/message';
import {
  BaseLayersSwitcherComponent,
  CapabilitiesService,
  DataSourceService,
  DropGeoFileDirective,
  FEATURE,
  Feature,
  GeolocateButtonComponent,
  HoverFeatureDirective,
  IgoMap,
  ImportService,
  Layer,
  LayerService,
  MapBrowserComponent,
  MapOfflineDirective,
  QueryDirective,
  QuerySearchSource,
  QueryService,
  Research,
  RotationButtonComponent,
  SearchBarComponent,
  SearchResult,
  SearchSource,
  SearchSourceService,
  ZoomButtonComponent,
  computeOlFeaturesExtent,
  featureToSearchResult,
  generateIdFromSourceOptions,
  handleFileImportError,
  handleFileImportSuccess,
  sourceCanReverseSearch,
  sourceCanSearch
} from '@igo2/geo';
import {
  ContextState,
  MapState,
  QueryState,
  SearchState
} from '@igo2/integration';
import { ObjectUtils } from '@igo2/utils';

import olFormatGeoJSON from 'ol/format/GeoJSON';
import * as olProj from 'ol/proj';

import { TranslateModule } from '@ngx-translate/core';
import { MapBrowserEvent } from 'ol';
import { Observable, Subscription, of, skip } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  skipWhile,
  take
} from 'rxjs/operators';
import { EnvironmentOptions } from 'src/environments/environnement.interface';

import { FooterComponent } from '../footer/footer.component';
import { LegendButtonComponent } from './legend-button/legend-button.component';
import { MapOverlayComponent } from './map-overlay/map-overlay.component';
import { BottomPanelComponent } from './panels/bottompanel/bottompanel.component';
import { PanelsHandlerComponent } from './panels/panels-handler/panels-handler.component';
import { ShownComponent } from './panels/panels-handler/panels-handler.enum';
import { PanelsHandlerState } from './panels/panels-handler/panels-handler.state';
import { SidePanelComponent } from './panels/sidepanel/sidepanel.component';
import {
  controlSlideX,
  controlSlideY,
  controlsAnimations
} from './portal.animation';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss'],
  animations: [controlsAnimations(), controlSlideX(), controlSlideY()],
  standalone: true,
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    SearchBarComponent,
    MatTooltip,
    SidePanelComponent,
    MapBrowserComponent,
    MapOfflineDirective,
    MapContextDirective,
    LayerContextDirective,
    DropGeoFileDirective,
    HoverFeatureDirective,
    QueryDirective,
    NgClass,
    BaseLayersSwitcherComponent,
    GeolocateButtonComponent,
    ZoomButtonComponent,
    RotationButtonComponent,
    LegendButtonComponent,
    BottomPanelComponent,
    FooterComponent,
    MapOverlayComponent,
    AsyncPipe,
    TranslateModule,
    PanelsHandlerComponent,
    NgTemplateOutlet
  ]
})
export class PortalComponent implements OnInit, AfterContentInit, OnDestroy {
  public appConfig: EnvironmentOptions;
  public hasFooter: boolean;

  public hasGeolocateButton: boolean;
  public showSearchBar: boolean;
  public legendPanelOpened = false;
  public legendDialogOpened = false;

  public termDefinedInUrl = false;
  public termDefinedInUrlTriggered = false;
  private addedLayers$$: Subscription[] = [];
  private layers$$: Subscription;

  private contextLoaded = false;
  private context$$: Subscription;
  private searchTerm$$: Subscription;

  private routeParams: Params;
  public mobile: boolean;
  @ViewChild('searchbar') searchBar: SearchBarComponent;

  public dialogOpened: MatDialogRef<unknown>;

  get map(): IgoMap {
    return this.mapState.map;
  }

  isMobile(): boolean {
    return this.mediaService.getMedia() === Media.Mobile;
  }

  public mobileBreakPoint: string = '(min-width: 768px)';
  public Breakpoints = Breakpoints;
  public currentBreakpoint: string = '';

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  get searchResultsGeometryEnabled(): boolean {
    return this.searchState.searchResultsGeometryEnabled$.value;
  }

  get queryStore(): EntityStore<SearchResult> {
    //FeatureInfo
    return this.queryState.store;
  }
  public panelOpenState = false;
  public mapQueryClick = false;
  public searchInit = false;

  public mapLayersShownInLegend: Layer[];

  public legendButtonTooltip: unknown;

  readonly breakpoint$: Observable<BreakpointState>;

  constructor(
    private route: ActivatedRoute,
    public mediaService: MediaService,
    public layerService: LayerService,
    public dataSourceService: DataSourceService,
    public capabilitiesService: CapabilitiesService,
    private contextState: ContextState,
    private mapState: MapState,
    public searchState: SearchState,
    public queryState: QueryState,
    private searchSourceService: SearchSourceService,
    private configService: ConfigService,
    private importService: ImportService,
    private http: HttpClient,
    private languageService: LanguageService,
    private messageService: MessageService,
    public dialogWindow: MatDialog,
    public dialog: MatDialog,
    public queryService: QueryService,
    private breakpointObserver: BreakpointObserver,
    private analyticsService: AnalyticsService,
    private panelsHandlerState: PanelsHandlerState
  ) {
    this.handleAppConfigs();
    this.dialogOpened = this.dialog.getDialogById(
      'legend-button-dialog-container'
    );
    this.legendButtonTooltip =
      this.languageService.translate.instant('legend.open');
    this.breakpoint$ = this.breakpointObserver
      .observe(this.mobileBreakPoint)
      .pipe(distinctUntilChanged());
  }

  ngOnInit() {
    this.panelsHandlerState.map = this.map;
    this.panelsHandlerState.queryState = this.queryState;
    this.panelsHandlerState.searchState = this.searchState;

    this.queryService.defaultFeatureCount = 1;
    window['IGO'] = this;
    this.map.ol.once('rendercomplete', () => {
      this.readQueryParams();
      if (this.appConfig.geolocate?.activateDefault) {
        this.map.geolocationController.tracking =
          this.appConfig.geolocate?.activateDefault;
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.readLanguageParam(params);
    });

    this.context$$ = this.contextState.context$.subscribe(
      (context: DetailedContext) => this.onChangeContext(context)
    );

    this.searchState.selectedResult$.subscribe((result) => {
      if (result && this.isMobile()) {
        this.closePanels();
      }
    });

    this.searchTerm$$ = this.searchState.searchTerm$
      .pipe(skip(1))
      .subscribe((searchTerm: string) => {
        if (searchTerm !== undefined && searchTerm !== null) {
          this.analyticsService.trackSearch(
            searchTerm,
            this.searchState.store.count
          );
        }
      });

    this.queryService.defaultFeatureCount = 1;

    this.queryStore.entities$.subscribe((entities) => {
      if (entities.length > 0) {
        this.openPanelonQuery();
      }
    });

    this.breakpoint$.subscribe(() => this.breakpointChanged());
  }

  private handleAppConfigs() {
    this.appConfig = this.configService.getConfigs();

    this.hasGeolocateButton = this.configService.getConfig(
      'geolocate.button.visible',
      true
    );

    this.showSearchBar = this.configService.getConfig(
      'searchBar.showSearchBar',
      true
    );

    this.hasFooter = this.configService.getConfig('hasFooter', true);

    this.mobileBreakPoint = this.configService.getConfig(
      'mobileBreakPoint',
      "'(min-width: 768px)'"
    );
  }

  ngAfterContentInit(): void {
    this.map.viewController.setInitialState();
  }

  togglePanelComponent(component: ShownComponent) {
    const currentComponent = this.panelsHandlerState.shownComponent$.getValue();
    const opened = this.panelsHandlerState.opened$.getValue();

    if (component !== currentComponent && opened) {
      this.panelsHandlerState.setShownComponent(component);
    } else {
      this.panelsHandlerState.setShownComponent(component);
      this.panelsHandlerState.togglePanels();
    }
  }

  panelOpened(event) {
    this.panelOpenState = event;
  }

  mapQuery(event) {
    this.mapQueryClick = event;
  }

  closePanelLegend() {
    this.legendPanelOpened = false;
    this.closePanels();
    this.map.propertyChange$.unsubscribe;
  }

  openPanelLegend() {
    this.legendPanelOpened = true;
    this.openPanels();
    this.map.propertyChange$.subscribe(() => {
      this.mapLayersShownInLegend = this.map.layers.filter(
        (layer) => layer.showInLayerList !== false
      );
    });
  }

  public breakpointChanged() {
    if (this.breakpointObserver.isMatched('(min-width: 768px)')) {
      this.currentBreakpoint = this.mobileBreakPoint;
      this.mobile = false;
    } else {
      this.mobile = true;
    }
  }

  ngOnDestroy() {
    this.context$$.unsubscribe();
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

  onMapQuery(event: { features: Feature[]; event: MapBrowserEvent<any> }) {
    if (this.appConfig.queryOnlyOne) {
      event.features = [event.features[0]];
      this.map.queryResultsOverlay.clear(); // to avoid double-selection in the map
    }
    const baseQuerySearchSource = this.getQuerySearchSource();
    const querySearchSourceArray: QuerySearchSource[] = [];
    if (event.features.length) {
      if (this.searchInit) {
        this.clearSearch();
      }
      this.clearSearchbarterm('');
      if (this.mapQueryClick) {
        this.onClearQuery();
      }
      this.openPanelonQuery();
      const results = event.features.map((feature: Feature) => {
        let querySearchSource = querySearchSourceArray.find(
          (s) => s.title === feature.meta.sourceTitle
        );
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
      });
      const filteredResults = results.filter((x) => x !== undefined);
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
      if (!this.searchInit && !this.legendPanelOpened && !this.mobile) {
        // in desktop keep legend opened if user clicks on the map
        this.panelOpenState = false;
      }
      if (!this.searchInit && this.mobile) {
        // mobile mode, close legend when user click on the map
        this.panelOpenState = false;
      }
    }
  }

  /**
   * Cancel ongoing add layer, if any
   */
  private cancelOngoingAddLayer() {
    this.addedLayers$$.forEach((sub: Subscription) => sub.unsubscribe());
    this.addedLayers$$ = [];
  }

  onSearchTermChange(term?: string) {
    if (this.mobile) {
      this.panelOpenState = true;
    }
    if (this.routeParams?.search && term !== this.routeParams.search) {
      this.searchState.deactivateCustomFilterTermStrategy();
    }

    this.searchState.setSearchTerm(term);
    const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();
    if (termWithoutHashtag.length < 2) {
      if (this.mobile) {
        this.panelOpenState = true;
      }
      this.clearSearch();
      return;
    }
    this.onBeforeSearch();
  }

  clearSearchbarterm(event) {
    if (!this.mobile) {
      this.searchBar.setTerm('');
    }
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
    if (!this.mapQueryClick && !this.searchInit && !this.legendPanelOpened) {
      this.panelOpenState = false;
    }
  }

  private openPanels() {
    this.panelOpenState = true;
  }

  private onChangeContext(context: DetailedContext) {
    this.cancelOngoingAddLayer();
    if (context === undefined) {
      return;
    }
    if (!this.queryState.store.empty) {
      this.queryState.store.softClear();
    }

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
    this.searchState.setSearchTerm('');
  }

  closePanelOnCloseQuery() {
    this.mapQueryClick = false;
    if (this.searchInit || this.legendPanelOpened) {
      this.openPanels(); // to prevent the panel to close when click searchbar after query
    }
  }

  openPanelonQuery() {
    this.mapQueryClick = true;
    this.openPanels;
    this.legendPanelOpened = false;
    this.clearSearch();
  }

  onClearQuery() {
    this.queryState.store.clear(); // clears the info panel
    this.queryState.store.softClear(); // clears the info panel
    this.map.queryResultsOverlay.clear(); // to avoid double-selection in the map
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
      this.map.viewController.zoomToExtent(
        olExtent as [number, number, number, number]
      );
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
      const entities$$ = this.searchStore.stateView
        .all$()
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
      if (
        this.routeParams['search'] &&
        !this.routeParams['zoom'] &&
        this.routeParams['sf'] !== '1'
      ) {
        const entities$$ = this.searchStore.stateView
          .all$()
          .pipe(
            skipWhile((entities) => entities.length === 0),
            debounceTime(500),
            take(1)
          )
          .subscribe((entities) => {
            entities$$.unsubscribe();
            const searchResultsOlFeatures = entities
              .filter((e) => e.entity.meta.dataType === FEATURE)
              .map((entity: EntityRecord<SearchResult>) =>
                new olFormatGeoJSON().readFeature(entity.entity.data, {
                  dataProjection: entity.entity.data.projection,
                  featureProjection: this.map.projection
                })
              );
            const totalExtent = computeOlFeaturesExtent(
              searchResultsOlFeatures,
              this.map.viewProjection
            );
            this.map.viewController.zoomToExtent(totalExtent);
          });
      }
      this.searchState.setSearchTerm(this.routeParams['search']);
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
        url = url
          .replace('VERSION=' + version, '')
          .replace('version=' + version, '');
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
    handleFileImportError(file, error, this.messageService);
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
    const arcgisClause =
      type === 'arcgisrest' ||
      type === 'imagearcgisrest' ||
      type === 'tilearcgisrest';
    let sourceOptions = {
      version: type === 'wmts' ? '1.0.0' : undefined,
      queryable: arcgisClause ? true : false,
      queryFormat: arcgisClause ? 'esrijson' : undefined,
      layer: name
    };
    if (type === 'wms') {
      sourceOptions = { params: { LAYERS: name, VERSION: version } } as any;
    }

    sourceOptions = ObjectUtils.removeUndefined(
      Object.assign({}, sourceOptions, commonSourceOptions)
    );

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
    if (
      visiblelayers.indexOf(currentLayerid) > -1 ||
      visiblelayers.indexOf(currentLayerid.toString()) > -1
    ) {
      visible = true;
    }
    if (
      invisiblelayers.indexOf(currentLayerid) > -1 ||
      invisiblelayers.indexOf(currentLayerid.toString()) > -1
    ) {
      visible = false;
    }
    return visible;
  }
}
