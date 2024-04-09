import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import {
  FeatureMotion,
  Research,
  SearchResult,
  SearchResultsComponent
} from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';

import { SearchResultAction } from '../../panels-handler.enum';
import { PanelsHandlerState } from '../../panels-handler.state';
import {
  onResultFocus,
  onResultSelect,
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
export class SearchResultPanelComponent {
  public searchResultActions = SearchResultAction;

  constructor(public panelsHandlerState: PanelsHandlerState) {}

  onSearchTermChange(term: string) {
    this.panelsHandlerState.searchState.setSearchTerm(term);
  }

  onResult(searchResultAction: SearchResultAction, searchResult: SearchResult) {
    switch (searchResultAction) {
      case SearchResultAction.Focus:
        onResultFocus(
          searchResult,
          this.panelsHandlerState.map,
          this.panelsHandlerState.searchState,
          {
            featureMotion: FeatureMotion.None
          }
        );
        break;
      case SearchResultAction.Select:
        this, this.panelsHandlerState.map.searchResultsOverlay.clear();
        onResultSelect(
          searchResult,
          this.panelsHandlerState.map,
          this.panelsHandlerState.searchState
        );
        this.close();
        break;
      case SearchResultAction.Unfocus:
        onResultUnfocus(searchResult, this.panelsHandlerState.map);
        break;
    }
  }
  onMoreResults(event: { research: Research; results: SearchResult[] }) {
    const results = event.results;
    this.panelsHandlerState.searchState.store.state.updateAll({
      focused: false,
      selected: false
    });
    const newResults = this.panelsHandlerState.searchState.store.entities$.value
      .filter((result: SearchResult) => result.source !== event.research.source)
      .concat(results);
    this.panelsHandlerState.searchState.store.updateMany(newResults);
    // todo scroll into view
  }

  close() {
    this.panelsHandlerState.setOpenedState(false);
  }
}
