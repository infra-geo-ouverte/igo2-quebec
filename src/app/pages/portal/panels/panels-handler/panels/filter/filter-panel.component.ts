import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import {
  FilterableDataSourcePipe,
  OgcFilterableItemComponent
} from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';

import { ShownComponent } from '../../panels-handler.enum';
import { PanelsHandlerState } from '../../panels-handler.state';

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    MatIconButton,
    MatIcon,
    TranslateModule,
    AsyncPipe,
    FilterableDataSourcePipe,
    OgcFilterableItemComponent
  ]
})
export class FilterPanelComponent {
  constructor(public panelsHandlerState: PanelsHandlerState) {}

  clear() {
    this.panelsHandlerState.componentToClose(ShownComponent.Filter);
  }
}
