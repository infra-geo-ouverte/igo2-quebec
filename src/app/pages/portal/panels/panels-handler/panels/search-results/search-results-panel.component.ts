import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import {
  FeatureMotion,
  IgoMap,
  Layer,
  Research,
  SearchResult,
  SearchResultsComponent
} from '@igo2/geo';
import { SearchState } from '@igo2/integration';

import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { SearchResultAction } from '../../panels-handler.enum';
import {
  onResultSelectOrFocus,
  onResultUnfocus
} from './search-results-panel.utils';

@Component({
  selector: 'app-search-results-panel',
  templateUrl: './search-results-panel.component.html',
  styleUrls: ['./search-results-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    MatIconButton,
    MatIcon,
    TranslateModule,
    SearchResultsComponent,
    AsyncPipe
  ]
})
export class SearchResultPanelComponent implements OnInit, OnDestroy {
  public searchResultActions = SearchResultAction;
  private empty$$: Subscription;

  @Input() map: IgoMap;
  @Input() searchState: SearchState;
  @Input() expanded: boolean;

  @Output() opened = new EventEmitter();
  @Output() closed = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.empty$$ = this.searchState.store.empty$.subscribe((e) => {
      if (!e && !this.expanded) {
        this.opened.emit();
      }
    });
  }

  ngOnDestroy() {
    this.empty$$.unsubscribe();
  }

  onSearchTermChange(term: string) {
    this.searchState.setSearchTerm(term);
  }

  onResult(searchResultAction: SearchResultAction, searchResult: SearchResult) {
    switch (searchResultAction) {
      case SearchResultAction.Focus:
        onResultSelectOrFocus(searchResult, this.map, this.searchState, {
          featureMotion: FeatureMotion.None
        });
        break;
      case SearchResultAction.Select:
        onResultSelectOrFocus(searchResult, this.map, this.searchState);
        this.close();
        break;
      case SearchResultAction.Unfocus:
        onResultUnfocus(searchResult, this.map, this.searchState);
        break;
    }
  }
  onMoreResults(event: { research: Research; results: SearchResult[] }) {
    const results = event.results;
    this.searchState.store.state.updateAll({ focused: false, selected: false });
    const newResults = this.searchState.store.entities$.value
      .filter((result: SearchResult) => result.source !== event.research.source)
      .concat(results);
    this.searchState.store.updateMany(newResults);
    // todo scroll into view
  }

  close() {
    this.closed.emit();
  }
}
