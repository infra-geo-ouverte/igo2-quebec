import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { IgoMap, Layer, SearchResultsComponent } from '@igo2/geo';
import { SearchState } from '@igo2/integration';

import { TranslateModule } from '@ngx-translate/core';

import { SearchResultAction } from '../../panels-handler.enum';
import {
  onResultFocus,
  onResultSelect,
  onResultUnfocus,
  onSearch
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

  @Input() map: IgoMap;
  @Input() searchState: SearchState;

  @Output() closed = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  ngOnDestroy() {}

  onSearchTermChange(term: string) {
    this.searchState.setSearchTerm(term);
  }

  onResult(searchResultAction: SearchResultAction, event) {
    console.log('searchResultAction', searchResultAction, event);
    switch (searchResultAction) {
      case SearchResultAction.Focus:
        onResultFocus();
        break;
      case SearchResultAction.Search:
        onSearch();
        break;
      case SearchResultAction.Select:
        onResultSelect();
        this.close();
        break;
      case SearchResultAction.Unfocus:
        onResultUnfocus();
        break;
    }
  }

  close() {
    this.closed.emit();
  }
}
