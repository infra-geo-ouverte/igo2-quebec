import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import {
  AsyncPipe,
  NgClass,
  NgSwitch,
  NgSwitchCase,
  NgTemplateOutlet
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef
} from '@angular/core';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';

import { SearchBarComponent } from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';
import { Observable, concatMap, distinctUntilChanged, of } from 'rxjs';

import { ShownComponent } from './panels-handler.enum';
import { PanelsHandlerState } from './panels-handler.state';
import { FilterPanelComponent } from './panels/filter/filter-panel.component';
import { LegendPanelComponent } from './panels/legend/legend-panel.component';
import { MapQueryResultsPanelComponent } from './panels/map-query-results/map-query-results-panel.component';
import { SearchResultPanelComponent } from './panels/search-results/search-results-panel.component';

@Component({
  selector: 'app-panels-handler',
  templateUrl: './panels-handler.component.html',
  styleUrls: ['./panels-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSidenav,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatTooltip,
    MatIconButton,
    MatIcon,
    AsyncPipe,
    TranslateModule,
    NgClass,
    MatMiniFabButton,
    NgTemplateOutlet,
    SearchBarComponent,
    NgSwitch,
    NgSwitchCase,
    LegendPanelComponent,
    SearchResultPanelComponent,
    MapQueryResultsPanelComponent,
    FilterPanelComponent
  ]
})
export class PanelsHandlerComponent implements OnInit, OnDestroy {
  public mobileMode$: Observable<boolean>;
  public openedPanel: boolean = false;

  @Input() searchBar: TemplateRef<SearchBarComponent>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public panelsHandlerState: PanelsHandlerState
  ) {
    this.mobileMode$ = this.breakpointObserver
      .observe('(min-width: 768px)')
      .pipe(
        distinctUntilChanged(),
        concatMap((breakpointState: BreakpointState) => {
          return of(!breakpointState.matches);
        })
      );
  }

  ngOnInit() {
    this.panelsHandlerState.opened$.subscribe((opened) =>
      this.handlePanels(opened)
    );
    this.panelsHandlerState.searchState.store.empty$.subscribe((e) => {
      if (!e) {
        this.panelsHandlerState.setShownComponent(ShownComponent.Search);
        this.panelsHandlerState.setOpenedState(true);
      }
    });
    this.panelsHandlerState.queryState.store.empty$.subscribe((e) => {
      if (!e) {
        this.panelsHandlerState.setShownComponent(ShownComponent.Query);
        this.panelsHandlerState.setOpenedState(true);
      }
    });
  }

  ngOnDestroy() {}

  handlePanels(value: boolean) {
    this.openedPanel = value;
  }

  openWithinPanel() {
    this.handlePanels(true);
  }

  closeWithinPanel() {
    this.handlePanels(false);
  }
}
