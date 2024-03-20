import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { Layer, LayerLegendListComponent } from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ShownComponent } from '../../panels-handler.enum';
import { PanelsHandlerState } from '../../panels-handler.state';

@Component({
  selector: 'app-legend-panel',
  templateUrl: './legend-panel.component.html',
  styleUrls: ['./legend-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    MatIconButton,
    MatIcon,
    TranslateModule,
    LayerLegendListComponent
  ]
})
export class LegendPanelComponent implements OnInit, OnDestroy {
  public mapLayersShownInLegend: Layer[];
  private layers$$: Subscription;

  constructor(public panelsHandlerState: PanelsHandlerState) {}

  ngOnInit() {
    this.layers$$ = this.panelsHandlerState.map.layers$.subscribe((layers) => {
      this.mapLayersShownInLegend = layers.filter(
        (layer) => layer.showInLayerList !== false
      );
    });
  }

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }

  clear() {
    this.panelsHandlerState.componentToClose(ShownComponent.Legend);
  }
}
