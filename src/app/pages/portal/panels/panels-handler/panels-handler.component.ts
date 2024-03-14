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

import { IgoMap, SearchBarComponent } from '@igo2/geo';
import { SearchState } from '@igo2/integration';

import { TranslateModule } from '@ngx-translate/core';
import { Observable, concatMap, distinctUntilChanged, of } from 'rxjs';

import { ShownComponent } from './panels-handler.enum';
import { LegendPanelComponent } from './panels/legend/legend-panel.component';
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
    SearchResultPanelComponent
  ]
})
export class PanelsHandlerComponent implements OnInit, OnDestroy {
  public mobileMode$: Observable<boolean>;
  public openedPanel: boolean = false;
  public shownComponent: ShownComponent = ShownComponent.Legend;

  @Input() searchState: SearchState;
  @Input() searchBar: TemplateRef<SearchBarComponent>;
  @Input() map: IgoMap;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.mobileMode$ = this.breakpointObserver
      .observe('(min-width: 768px)')
      .pipe(
        distinctUntilChanged(),
        concatMap((breakpointState: BreakpointState) => {
          return of(!breakpointState.matches);
        })
      );
  }

  ngOnInit() {}

  ngOnDestroy() {}

  handlePanels(opened: boolean) {
    console.log('panel opened: ', opened);
    this.openedPanel = opened;
  }

  closeWithinPanel() {
    this.shownComponent = ShownComponent.Search;
    this.handlePanels(false);
  }
}
