import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { IgoMap, Layer } from '@igo2/geo';
import { MapState } from '@igo2/integration';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-legend-button',
  templateUrl: './legend-button.component.html',
  styleUrls: ['./legend-button.component.scss']
})

export class LegendButtonComponent {

  public dialogRef = null;

  constructor(public dialog: MatDialog) {}

  toggleDialog() {
    const dialogOpened = this.dialog.getDialogById('legend-button-dialog-container');
      if (!dialogOpened) {
        this.dialogRef = this.dialog.open(LegendButtonDialogComponent, {
          id: 'legend-button-dialog-container',
          hasBackdrop: false,
          closeOnNavigation: true
        });
      } else {
        this.dialogRef.close();
      }
  }
}

@Component({
  selector: 'app-legend-button-dialog',
  templateUrl: 'legend-button-dialog.component.html'
})
export class LegendButtonDialogComponent implements OnInit {

  public getState: MatDialogState;

  get map(): IgoMap {
    return this.mapState.map;
  }

  get layers$(): Observable<Layer[]> {
    return this.map.layers$;
  }

  public mapLayersShownInLegend:Layer[];

  constructor(
    private mapState: MapState
  ) {}

  ngOnInit() {

    // filters no-legend layers such as the hoverFeature
    this.mapLayersShownInLegend = this.map.layers.filter(layer => (
      layer.showInLayerList !== false
      ));

  }

}
