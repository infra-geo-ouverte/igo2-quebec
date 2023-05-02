import { LanguageService } from '@igo2/core';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LegendDialogComponent } from './legend-dialog.component';

@Component({
  selector: 'app-legend-dialog-button',
  templateUrl: '../legend-button.component.html',
  styleUrls: ['../legend-button.component.scss']
})

export class LegendDialogButtonComponent {

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
    const dialogOpened = this.dialog.getDialogById('legend-dialog-container');
      if (!dialogOpened) {
        this.dialogRef = this.dialog.open(LegendDialogComponent, {
          id: 'legend-dialog-container',
          hasBackdrop: false,
          closeOnNavigation: true
        });
      } else {
        this.dialogRef.close();
      }
  }
}
