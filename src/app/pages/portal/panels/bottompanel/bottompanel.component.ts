import {
  Component,
  Input,
  OnInit,
  Output,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef
} from '@angular/core';

import olFeature from 'ol/Feature';
import olPoint from 'ol/geom/Point';

import { StorageService } from '@igo2/core';
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

  @Input() hideToggle = false;

  @Input() mobile : boolean; // to pass the input to featureDetails tooltip

  @Input() mapQueryClick : boolean;

  @Output() mapQuery = new EventEmitter<boolean>();

  get queryStore(): EntityStore<SearchResult> {
    return this.queryState.store;
  }

  private focusedResult$: BehaviorSubject<SearchResult> = new BehaviorSubject(
    undefined
  );

  resultSelected$ = new BehaviorSubject<SearchResult<Feature>>(undefined);

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

  @Input()
  get layers(): Layer[] {
    return this._layers;
  }
  set layers(value: Layer[]) {
    this._layers = value;
  }
  private _layers: Layer[];

  public mapLayersShownInLegend: Layer[];

  @Input() panelOpenState: boolean;

  @Output() panelOpened = new EventEmitter<boolean>();

  @Output() closeQuery = new EventEmitter<boolean>();

  constructor(
    private configService: ConfigService,
    private mapService: MapService,
    private searchState: SearchState,
    private searchService: SearchService,
    private queryState: QueryState,
    private cdRef: ChangeDetectorRef,
    private mapState: MapState,
    private storageState: StorageState,
    private elRef: ElementRef
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
        this.mapQuery.emit(true);
        this.clearSearch();
        this.searchInit = false;
      } else {
        if (!this.legendPanelOpened && !this.searchInit){
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
    this.mapQuery.emit(false);
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
    this.clearedSearchbar = false;
    const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();

    if (termWithoutHashtag.length < 2) {
      this.searchStore.clear();
      this.selectedFeature = undefined;
      this.searchInit = false;
      this.clearSearch();
    } else {
      if (this.mapQueryClick){
        this.queryState.store.softClear();
        this.mapQuery.emit(false);
        this.searchInit = true;
      }
    }
  }

  onSearch(event: { research: Research; results: SearchResult[] }) {
    this.openPanel();
    if (this.mapQueryClick) { // to clear the mapQuery if a search is initialized
      this.queryState.store.softClear();
      this.map.queryResultsOverlay.clear();
      this.mapQuery.emit(false);
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

    setTimeout(() => {
      const igoList = this.elRef.nativeElement.querySelector('igo-list');
      let moreResults;
      event.research.request.subscribe((source) => {
        if (!source[0] || !source[0].source) {
          moreResults = null;
        } else if (source[0].source.getId() === 'icherche') {
          moreResults = igoList.querySelector('.icherche .moreResults');
        } else if (source[0].source.getId() === 'ilayer') {
          moreResults = igoList.querySelector('.ilayer .moreResults');
        } else if (source[0].source.getId() === 'nominatim') {
          moreResults = igoList.querySelector('.nominatim .moreResults');
        } else {
          moreResults = igoList.querySelector('.' + source[0].source.getId() + ' .moreResults');
        }
        if (
          moreResults !== null &&
          !this.isScrolledIntoView(igoList, moreResults)
        ) {
          igoList.scrollTop =
            moreResults.offsetTop +
            moreResults.offsetHeight -
            igoList.clientHeight;
        }
      });
    }, 250);
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
    if (!this.panelOpenState && this.clearedSearchbar === false){
      this.openPanel();
    }
    event.stopPropagation();
  }

  clearQuery(): void{
    this.queryState.store.softClear();
    this.queryState.store.clear();
    this.mapQuery.emit(false);
    this.removeFeatureFromMap();
  }

  closePanelOnCloseQuery(){
    this.mapQuery.emit(false);
    this.closeQuery.emit();
    this.cdRef.detectChanges();
    if (this.searchInit || this.legendPanelOpened) {
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
    }
  }

  clearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
    this.term="";
  }

  closePanelLegend() { // this flushes the legend whenever a user closes the panel. if not, the user has to click twice on the legend button to open the legend with the button
    this.legendPanelOpened = false;
    this.closePanel();
    this.closeLegend.emit();
    this.map.propertyChange$.unsubscribe;
  }

  panelOpenedFromFeature(event) {
    this.panelOpened.emit(event);
  }

  mapQueryFromFeature(event) {
    this.mapQuery.emit(event);
  }

  closePanel(){
    if (!this.searchInit && !this.mapQueryClick && !this.legendPanelOpened){
      this.panelOpened.emit(false);
    }
  }

  openPanel(){
    this.panelOpened.emit(true);
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
