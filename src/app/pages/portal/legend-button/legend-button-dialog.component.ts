import { LanguageService } from '@igo2/core';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialogState } from '@angular/material/dialog';
import { IgoMap, Layer } from '@igo2/geo';
import { MapState } from '@igo2/integration';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-legend-button-dialog',
  templateUrl: 'legend-button-dialog.component.html',
  styleUrls: ['./legend-button.component.scss']
})
export class LegendButtonDialogComponent implements OnInit {

  public getState: MatDialogState;

  get map(): IgoMap {
    return this.mapState.map;
  }

  get layers$(): Observable<Layer[]> {
    return this.map.layers$;
  }

  public mapLayersShownInLegend: Layer[];

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  constructor(
    private mapState: MapState,
    protected languageService: LanguageService
  ) {}

  ngOnInit() {
    this.mapLayersShownInLegend = this.map.layers.filter(layer => (
      layer.showInLayerList !== false
    ));
  }
}
