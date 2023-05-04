import {
  Component,
  Input,
  Output,
  OnInit,
  OnDestroy,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';

import { EntityStore, ActionStore } from '@igo2/common';

import { BehaviorSubject } from 'rxjs';

import {
  IgoMap,
  FEATURE,
  Feature,
  FeatureMotion,
  LayerService,
  MapService,
  Research,
  SearchResult,
  SearchService,
  Layer
} from '@igo2/geo';
import { QueryState, MapState } from '@igo2/integration';
import { ConfigService, LanguageService } from '@igo2/core';

import { SearchState } from '../search-results-tool/search.state';

@Component({
  selector: 'app-sidepanel',
  templateUrl: './sidepanel.component.html',
  styleUrls: ['./sidepanel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidePanelComponent implements OnInit, OnDestroy {
  title$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);

  @Input()
  get map(): IgoMap {
    return this._map;
  }
  set map(value: IgoMap) {
    this._map = value;
  }
  private _map: IgoMap;

  @Input()
  get opened(): boolean {
    return this._opened;
  }
  set opened(value: boolean) {
    if (value === this._opened) {
      return;
    }

    this._opened = value;
    this.openedChange.emit(this._opened);
  }
  private _opened: boolean;

  @Output() openedChange = new EventEmitter<boolean>();

  @Input()
  get mobile(): boolean {
    return this._mobile;
  }
  set mobile(value: boolean) {
    this._mobile = value;
  }
  private _mobile: boolean;

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
  public hasFeatureEmphasisOnSelection: Boolean = false;

  @Input()
  get featureTitle(): string {
    return this._featureTitle;
  }
  set featureTitle(value: string) {
    this._featureTitle = value;
  }
  private _featureTitle: string;

  // SEARCH

  @Input()
  get searchInit(): boolean {
    return this._searchInit;
  }
  set searchInit(value: boolean) {
    this._searchInit = value;
  }
  private _searchInit: boolean;

  public hasToolbox: boolean = undefined;
  public store = new ActionStore([]);
  public igoSearchPointerSummaryEnabled: boolean = false;

  public termSplitter: string = '|';

  @ViewChild('mapBrowser', { read: ElementRef, static: true }) mapBrowser: ElementRef;

  public lonlat;
  public mapProjection: string;
  public term: string;
  public settingsChange$ = new BehaviorSubject<boolean>(undefined);

  get searchStore(): EntityStore<SearchResult> {
    return this.searchState.store;
  }

  // LEGEND

  @Input()
  get layers(): Layer[] {
    return this._layers;
  }
  set layers(value: Layer[]) {
    this._layers = value;
  }
  private _layers: Layer[];

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  @Input()
  get panelOpenState(): boolean {
    return this._panelOpenState;
  }
  set panelOpenState(value: boolean) {
    this._panelOpenState = value;
  }
  private _panelOpenState: boolean;

  @Output() closeLegend = new EventEmitter<boolean>();
  @Output() openLegend = new EventEmitter<boolean>();
  @Output() closeQuery = new EventEmitter<boolean>();
  public mapLayersShownInLegend: Layer[];

  constructor(
    protected languageService: LanguageService,
    private configService: ConfigService,
    private mapService: MapService,
    private layerService: LayerService,
    private searchState: SearchState,
    private searchService: SearchService,
    private queryState: QueryState,
    private cdRef: ChangeDetectorRef,
    private mapState: MapState,
    private elRef: ElementRef
    ) {
      this.hasToolbox = this.configService.getConfig('hasToolbox') === undefined ? false :
        this.configService.getConfig('hasToolbox');
    }

    ngOnInit(){
      this.queryStore.entities$
      .subscribe(
        (entities) => {
        if (entities.length > 0) {
          //this.opened = true;
          this.mapQueryClick = true;
          this.legendPanelOpened = false;
          this.panelOpenState = true;
          this.onClearSearch();
        }
      });
    } // End OnInit

    @HostListener('change')
    ngOnDestroy() {
      this.store.destroy();
      this.store.entities$.unsubscribe();
      //this.opened = false;
      this.legendPanelOpened = false;
      this.onClearSearch();
      this.clearQuery();
      this.map.propertyChange$.unsubscribe;
    }

    //SEARCH
    onPointerSummaryStatusChange(value) {
      this.igoSearchPointerSummaryEnabled = value;
    }

    onSearchTermChange(term = '') {
      this.term = term;
      const termWithoutHashtag = term.replace(/(#[^\s]*)/g, '').trim();
      if (termWithoutHashtag.length < 2) {
        this.searchStore.clear();
        this.selectedFeature = undefined;
      }
    }

    onSearch(event: { research: Research; results: SearchResult[] }) {
      if (this.mapQueryClick = true) { // to clear the mapQuery if a search is initialized
        this.queryState.store.softClear();
        this.map.queryResultsOverlay.clear();
        this.mapQueryClick = false;
      }
      this.store.clear();
      // search
      this.searchInit = true;
      this.legendPanelOpened = false;
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
      this.tryAddFeatureToMap(result);
      this.selectedFeature = (result as SearchResult<Feature>).data;
    }

    /**
     * Try to add a feature to the map overlay
     * @param layer A search result that could be a feature
     */
    private tryAddFeatureToMap(layer: SearchResult) {
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

      this.hasFeatureEmphasisOnSelection = this.configService.getConfig('hasFeatureEmphasisOnSelection');
    }


  /*
   * Remove a feature to the map overlay
   */
  removeFeatureFromMap() {
    this.map.searchResultsOverlay.clear();
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

  closePanelOnCloseQuery(){
    this.closeQuery.emit();
    this.mapQueryClick = false;
    if (this.searchInit === false && this.legendPanelOpened === false){
      this.panelOpenState = false;
    } if (this.searchInit === true || this.legendPanelOpened === true) {
      this.panelOpenState = true;
    }
  }

  onClearSearch() {
    this.map.searchResultsOverlay.clear();
    this.searchStore.clear();
    this.searchState.setSelectedResult(undefined);
    this.searchState.deactivateCustomFilterTermStrategy();
    this.searchInit = false;
    this.term = '';
    this.searchState.setSearchTerm('');
  }

  clearQuery(): void{
    this.queryState.store.softClear();
    this.queryState.store.clear();
    this.mapQueryClick = false;
    this.removeFeatureFromMap();
  }

  // LEGEND

  closePanelLegend() { // this flushes the legend whenever a user closes the panel. if not, the user has to click twice on the legend button to open the legend with the button
    //this.opened = false;
    this.legendPanelOpened = false;
    this.closeLegend.emit();
    this.map.propertyChange$.unsubscribe;
  }

/*
  openPanelLegend(){ /// semble inutile .. si oui (legendPanelOpened)="legendPanelOpened" dans mat-sidenav
    this.map.propertyChange$.subscribe(() => {
      this.mapLayersShownInLegend = this.map.layers.filter(layer => (
        layer.showInLayerList !== false
      ));
    });
    this.opened = true;
    this.legendPanelOpened = true;
    this.clearQuery();
    this.onClearSearch();
    this.mapQueryClick = false;
    this.openLegend.emit(true);
  }*/

}
