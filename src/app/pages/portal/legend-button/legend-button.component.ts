import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { IgoMap } from '@igo2/geo';
import { MapState } from '@igo2/integration';

@Component({
  selector: 'app-legend-button',
  templateUrl: './legend-button.component.html',
  styleUrls: ['./legend-button.component.scss']
})

export class LegendButtonComponent {

  @Input() isDialogOpened: boolean;

  constructor(
    public dialog: MatDialog
    ) { }

    dialogRef = null;

    toggleDialog() {
      const dialogOpened = this.dialog.getDialogById('legend-button-dialog-container');
        if(!dialogOpened) {
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
export class LegendButtonDialogComponent {

  public getState: MatDialogState

  get map(): IgoMap {
    return this.mapState.map;
  }

  constructor(
    private mapState: MapState,
    public dialog: MatDialog
    ) { }

}
