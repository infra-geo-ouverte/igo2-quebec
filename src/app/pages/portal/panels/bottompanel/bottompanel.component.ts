import {
  Component,
  Input,
  OnInit,
  Output,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import olFeature from 'ol/Feature';
import olPoint from 'ol/geom/Point';

import { LanguageService, StorageService } from '@igo2/core';
import { EntityStore, ActionStore } from '@igo2/common';
import { BehaviorSubject, Subscription, combineLatest, tap} from 'rxjs';

import {
  IgoMap,
  FEATURE,
  Feature,
  FeatureMotion,
  MapService,
  Research,
  SearchResult,
  SearchService,
  Layer,
  featureToOl,
  featuresAreTooDeepInView,
  featureFromOl,
  getCommonVectorSelectedStyle,
  getCommonVectorStyle
} from '@igo2/geo';
import { MapState, QueryState, StorageState } from '@igo2/integration';
import { SearchState } from '../search-results-tool/search.state';
import { ConfigService } from '@igo2/core';

import type { default as OlGeometry } from 'ol/geom/Geometry';
@Component({
  selector: 'app-bottompanel',
  templateUrl: './bottompanel.component.html',
  styleUrls: ['./bottompanel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomPanelComponent implements OnInit, OnDestroy {

  title$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  @Output() closeLegend = new EventEmitter<boolean>();

  @Input()
  get map(): IgoMap {
    return this.mapState.map;
  }

  @Input() // for tooltipPosition in featureDetails
  get mobile(): boolean {
    return this._mobile;
  }
  set mobile(value: boolean) {
    this._mobile = value;
  }
  private _mobile: boolean;

  // EXPANSION PANEL

  @Input()
  hideToggle = false;

  @Input()
  get expanded(): boolean {
    return this._expanded;
  }
  set expanded(value: boolean) {
    if (value === this._expanded) {
      return;
    }
    this._expanded = value;
    this.expandedChange.emit(this._expanded);
  }
  private _expanded: boolean;

  @Output() expandedChange = new EventEmitter<boolean>();

  // QUERY

  @Input()
  get mapQueryClick(): boolean {
    return this._mapQueryClick;
  }
  set mapQueryClick(value: boolean) {
    this._mapQueryClick = value;
  }
  private _mapQueryClick: boolean;

  get queryStore(): EntityStore<SearchResult> {
    return this.queryState.store;
  }

  private focusedResult$: BehaviorSubject<SearchResult> = new BehaviorSubject(
    undefined
  );

  resultSelected$ = new BehaviorSubject<SearchResult<Feature>>(undefined);

  // Feature details
  @Output() selectFeature = new EventEmitter<boolean>();

  @Input()
  get feature(): Feature {
    return this._feature;
  }
  set feature(value: Feature) {
    this._feature = value;
    this.cdRef.detectChanges();
    this.selectFeature.emit();
  }
  private _feature: Feature;

  public selectedFeature: Feature;
  public hasFeatureEmphasisOnSelection = false;

  // SEARCH

  @Input()
  get term(): string {
    return this._term;
  }
  set term(value: string) {
    this._term = value;
    this.pageIterator = [];
  }
  public _term: string;

  @Input()
  get searchInit(): boolean {
    return this._searchInit;
  }
  set searchInit(value: boolean) {
    this._searchInit = value;
  }
  private _searchInit: boolean;

  public store = new ActionStore([]);
  public showSearchBar: boolean;
  public igoSearchPointerSummaryEnabled: boolean = false;
    get termSplitter(): string {
    return this.searchState.searchTermSplitter$.value;
  }
  public forceCoordsNA: boolean = false;

  public clearedSearchbar = false;

  public lonlat;
  public mapProjection: string;

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  public pageIterator: {sourceId: string}[] = [];

  get storageService(): StorageService {
    return this.storageState.storageService;
  }
  private abstractFocusedResult: Feature;
  private abstractSelectedResult: Feature;
  public withZoomButton = false;

  zoomAuto$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  get zoomAuto(): boolean {
    return this._zoomAuto;
  }
  set zoomAuto(value) {
    if (value !== !this._zoomAuto) {
      return;
    }
    this._zoomAuto = value;
    this.zoomAuto$.next(value);
    this.storageService.set('zoomAuto', value);
  }
  private _zoomAuto = false;

  private resultOrResolution$$: Subscription;

  private shownResultsEmphasisGeometries: Feature[] = [];

  // LEGEND
  @Input()
  get layers(): Layer[] {
    return this._layers;
  }
  set layers(value: Layer[]) {
    this._layers = value;
  }
  private _layers: Layer[];

  public mapLayersShownInLegend: Layer[];

  @Input()
  get panelOpenState(): boolean {
    return this._panelOpenState;
  }
  set panelOpenState(value: boolean) {
    this._panelOpenState = value;
  }
  private _panelOpenState: boolean;

  @Output() closeQuery = new EventEmitter<boolean>();
  @Output() openQuery = new EventEmitter<boolean>();
  @Output() openLegend = new EventEmitter<boolean>();

  constructor(
    private configService: ConfigService,
    //SEARCH
    private languageService: LanguageService,
    private mapService: MapService,
    private searchState: SearchState,
    private searchService: SearchService,
    private queryState: QueryState,
    private cdRef: ChangeDetectorRef,
    private mapState: MapState,
    private storageState: StorageState
    ) {
      this.mapService.setMap(this.map);
      this.showSearchBar = this.configService.getConfig('showSearchBar') === undefined ? true :
      this.configService.getConfig('showSearchBar');
      this.zoomAuto = this.storageService.get('zoomAuto') as boolean;
    }

  ngOnInit(){
    this.closePanel();
    this.forceCoordsNA = this.configService.getConfig('app.forceCoordsNA');

    this.queryStore.entities$
    .subscribe(
      (entities) => {
      if (entities.length > 0) {
        this.openPanel();
        this.mapQueryClick = true;
      } else {
        if (this.legendPanelOpened === false && this.searchInit === false){
          this.closePanel();
        }
      }
    });

    this.map.propertyChange$.subscribe(() => {
      this.mapLayersShownInLegend = this.map.layers.filter(layer => (
        layer.showInLayerList !== false
      ));
    });

    let latestResult;
    let trigger;
    if (this.hasFeatureEmphasisOnSelection) {
      this.resultOrResolution$$ = combineLatest([
        this.focusedResult$.pipe(
          tap((res) => {
            latestResult = res;
            trigger = 'focused';
          })
        ),
        this.resultSelected$.pipe(
          tap((res) => {
            latestResult = res;
            trigger = 'selected';
          })
        ),
        this.map.viewController.resolution$,
        this.store.entities$
      ]).subscribe(() => this.buildResultEmphasis(latestResult, trigger));
    }

  }

  ngOnDestroy() {
    this.searchInit = false;
    this.mapQueryClick = false;
    this.store.destroy();
    this.store.entities$.unsubscribe();
    this.map.propertyChange$.unsubscribe;
    this.queryState.store.destroy();
    this.clearSearch();
  }

  onPointerSummaryStatusChange(value) {
    this.igoSearchPointerSummaryEnabled = value;
  }

  onSearchTermChange(term = '') {
    this.term = term;
    this.searchInit = true;
    this.clearedSearchbar = false;
    if (this.mapQueryClick === true){
      this.queryState.store.softClear();
      this.mapQueryClick = false;
    }
    const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();

    if (termWithoutHashtag.length < 2) {
      this.searchStore.clear();
      this.selectedFeature = undefined;
      this.searchInit = false;
      this.clearSearch();
      //this.closePanel(); causes the panel to close when typing the searchbar
    }
  }

  onSearch(event: { research: Research; results: SearchResult[] }) {
    this.openPanel();
    if (this.mapQueryClick = true) { // to clear the mapQuery if a search is initialized
      this.queryState.store.softClear();
      this.map.queryResultsOverlay.clear();
      this.mapQueryClick = false;
    }
    this.legendPanelOpened = false;
    this.queryState.store.softClear();
    this.searchInit = true;
    this.clearedSearchbar = false;
    this.store.clear();
    const results = event.results;
    this.searchStore.state.updateAll({ focused: false, selected: false });
    const newResults = this.searchStore.entities$.value
      .filter((result: SearchResult) => result.source !== event.research.source)
      .concat(results);
    this.searchStore.updateMany(newResults);
  }

  isScrolledIntoView(elemSource, elem) {
    const padding = 6;
    const docViewTop = elemSource.scrollTop;
    const docViewBottom = docViewTop + elemSource.clientHeight;

    const elemTop = elem.offsetTop;
    const elemBottom = elemTop + elem.clientHeight + padding;
    return elemBottom <= docViewBottom && elemTop >= docViewTop;
  }
  /**
   * Try to add a feature to the map when it's being focused
   * @internal
   * @param result A search result that could be a feature
   */

  onResultFocus(result: SearchResult) {
    this.focusedResult$.next(result);
    if (result.meta.dataType === FEATURE && result.data.geometry) {
      result.data.meta.style = getCommonVectorSelectedStyle(
        Object.assign({},
          { feature: result.data as Feature | olFeature<OlGeometry> },
          this.searchState.searchOverlayStyleFocus,
          result.style?.focus ? result.style.focus : {}));

      const feature = this.map.searchResultsOverlay.dataSource.ol.getFeatureById(result.meta.id);
      if (feature) {
        feature.setStyle(result.data.meta.style);
        return;
      }
      this.map.searchResultsOverlay.addFeature(result.data as Feature, FeatureMotion.None);
    }
    this.tryAddFeatureToMap(result);
    this.selectedFeature = (result as SearchResult<Feature>).data;
    if (this.selectedFeature !== undefined ){
      this.closePanel();
    }
  }

  /**
   * Try to add a feature to the map overlay
   * @param layer A search result that could be a feature
   */
  private tryAddFeatureToMap(layer: SearchResult) {
    if ( this.searchState.setSelectedResult !== undefined){
      this.closePanel();
    }
    if (layer.meta.dataType !== FEATURE) {
      return undefined;
    }

    // Somethimes features have no geometry. It happens with some GetFeatureInfo
    if (layer.data.geometry === undefined) {
      return;
    }

    this.map.searchResultsOverlay.setFeatures(
      [layer.data] as Feature[],
      FeatureMotion.Default
    );
    this.closePanel();
    this.hasFeatureEmphasisOnSelection = this.configService.getConfig('hasFeatureEmphasisOnSelection');
  }

  /*
   * Remove a feature to the map overlay
   */
  removeFeatureFromMap() {
    this.map.searchResultsOverlay.clear();
    this.closePanel();
  }

  onSearchCoordinate() {
    this.searchStore.clear();
    const results = this.searchService.reverseSearch(this.lonlat);

    for (const i in results) {
      if (results.length > 0) {
        results[i].request.subscribe((_results: SearchResult<Feature>[]) => {
          this.onSearch({ research: results[i], results: _results });
        });
      }
    }
  }

  onSearchBarClick(event){ /// prevents panel to close on clear search
    if (this.expanded === false && this.clearedSearchbar === false){
      this.openPanel();
    }
    event.stopPropagation();
  }

  clearQuery(): void{
    this.queryState.store.softClear();
    this.queryState.store.clear();
    this.mapQueryClick = false;
    this.removeFeatureFromMap();
  }

  closePanelOnCloseQuery(){
    this.mapQueryClick = false;
    this.closeQuery.emit();
    this.cdRef.detectChanges();
    if (this.searchInit === false && this.legendPanelOpened === false){
      //this.closePanel(); //// causes panel to close when click searchbar after query
    } if (this.searchInit === true || this.legendPanelOpened === true) {
      this.openPanel();
    }
  }

  clearSearchBar(event){
    this.searchInit = false;
    this.clearSearch();
    this.closePanel();
    this.clearedSearchbar = true;
    if (event){
      event.stopPropagation(); //prevents panel toggling on click or focus
      //event.stopImmediatePropagation();
    }
  }

  clearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
  }

  closePanelLegend() { // this flushes the legend whenever a user closes the panel. if not, the user has to click twice on the legend button to open the legend with the button
    this.legendPanelOpened = false;
    this.closePanel();
    this.closeLegend.emit();
    this.map.propertyChange$.unsubscribe;
  }

  openPanelLegend() {
    this.legendPanelOpened = true;
    this.openPanel();
    if (this.legendPanelOpened === true){
      this.searchInit = false;
      this.mapQueryClick = false;
      this.clearQuery();
      this.clearSearch();
    }
  }

  closePanel(){
    this.expanded = false;
    this.panelOpenState = false;
  }

  openPanel(){
    this.panelOpenState = true;
    this.expanded = true;
  }

  private clearFeatureEmphasis(trigger: 'selected' | 'focused' | 'shown') {
    if (trigger === 'focused' && this.abstractFocusedResult) {
      this.map.searchResultsOverlay.removeFeature(this.abstractFocusedResult);
      this.abstractFocusedResult = undefined;
    }
    if (trigger === 'selected' && this.abstractSelectedResult) {
      this.map.searchResultsOverlay.removeFeature(this.abstractSelectedResult);
      this.abstractSelectedResult = undefined;
    }
    if (trigger === 'shown') {
      this.shownResultsEmphasisGeometries.map(shownResult => this.map.searchResultsOverlay.removeFeature(shownResult));
      this.shownResultsEmphasisGeometries = [];
    }
  }

  private buildResultEmphasis(
    result: SearchResult<Feature>,
    trigger: 'selected' | 'focused' | 'shown' | undefined
  ) {
    if (trigger !== 'shown') {
      this.clearFeatureEmphasis(trigger);
    }
    if (!result || !result.data.geometry) {
      return;
    }
    const myOlFeature = featureToOl(result.data, this.map.projection);
    const olGeometry = myOlFeature.getGeometry();
    if (featuresAreTooDeepInView(this.map, olGeometry.getExtent() as [number, number, number, number], 0.0025)) {
      const extent = olGeometry.getExtent();
      const x = extent[0] + (extent[2] - extent[0]) / 2;
      const y = extent[1] + (extent[3] - extent[1]) / 2;
      const feature1 = new olFeature({
        name: `${trigger}AbstractResult'`,
        geometry: new olPoint([x, y])
      });
      const abstractResult = featureFromOl(feature1, this.map.projection);

      let computedStyle;
      let zIndexOffset = 0;

      switch (trigger) {
        case 'focused':
          computedStyle = getCommonVectorSelectedStyle(
            Object.assign({},
              { feature: abstractResult },
              this.searchState.searchOverlayStyleFocus,
              result.style?.focus ? result.style.focus : {}));
          zIndexOffset = 2;
          break;
        case 'shown':
          computedStyle = getCommonVectorStyle(Object.assign({},
            { feature: abstractResult },
            this.searchState.searchOverlayStyle,
            result.style?.base ? result.style.base : {}));
          break;
        case 'selected':
          computedStyle = getCommonVectorSelectedStyle(
            Object.assign({},
              { feature: abstractResult },
              this.searchState.searchOverlayStyleSelection,
              result.style?.selection ? result.style.selection : {}));
          zIndexOffset = 1;
          break;
      }
      abstractResult.meta.style = computedStyle;
      abstractResult.meta.style.setZIndex(2000 + zIndexOffset);
      this.map.searchResultsOverlay.addFeature(abstractResult, FeatureMotion.None);
      if (trigger === 'focused') {
        this.abstractFocusedResult = abstractResult;
      }
      if (trigger === 'selected') {
        this.abstractSelectedResult = abstractResult;
      }
      if (trigger === 'shown') {
        this.shownResultsEmphasisGeometries.push(abstractResult);
      }
    } else {
      this.clearFeatureEmphasis(trigger);
    }
  }

}
