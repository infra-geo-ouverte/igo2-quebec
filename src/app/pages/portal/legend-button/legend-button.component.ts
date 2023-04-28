import { LanguageService } from '@igo2/core';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LegendButtonDialogComponent } from './legend-button-dialog.component';

@Component({
  selector: 'app-legend-button',
  templateUrl: '../legend-button.component.html',
  styleUrls: ['../sideresult/legend-panel-button/legend-panel-button.component.scss']
})

export class LegendButtonComponent {

  public dialogRef = null;

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  constructor(public dialog: MatDialog, protected languageService: LanguageService) {}

  toggleLegendButton() {
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
