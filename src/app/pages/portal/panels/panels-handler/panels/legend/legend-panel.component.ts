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

import { IgoMap, Layer, LayerLegendListComponent } from '@igo2/geo';

import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

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
  @Input() map: IgoMap;
  @Output() closed = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.layers$$ = this.map.layers$.subscribe((layers) => {
      this.mapLayersShownInLegend = layers.filter(
        (layer) => layer.showInLayerList !== false
      );
    });
  }

  ngOnDestroy() {
    this.layers$$.unsubscribe();
  }

  close() {
    this.closed.emit();
  }
}
