import { Component, OnInit } from '@angular/core';
import { MatDialogState, MatDialogTitle, MatDialogActions, MatDialogClose } from '@angular/material/dialog';

import { IgoMap, Layer, LayerLegendListComponent } from '@igo2/geo';
import { MapState } from '@igo2/integration';

import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
    selector: 'app-legend-dialog',
    templateUrl: 'legend-dialog.component.html',
    styleUrls: ['./legend-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatDialogActions, MatIconButton, MatDialogClose, MatIcon, LayerLegendListComponent, TranslateModule]
})
export class LegendDialogComponent implements OnInit {
  public getState: MatDialogState;

  get map(): IgoMap {
    return this.mapState.map;
  }

  get layers$(): Observable<Layer[]> {
    return this.map.layers$;
  }

  public mapLayersShownInLegend: Layer[];

  constructor(private mapState: MapState) {}

  ngOnInit() {
    this.mapLayersShownInLegend = this.map.layers.filter(
      (layer) => layer.showInLayerList !== false
    );
  }
}
