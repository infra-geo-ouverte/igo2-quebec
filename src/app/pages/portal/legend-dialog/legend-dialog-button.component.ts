import { LanguageService } from '@igo2/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LegendDialogComponent } from './legend-dialog.component';

@Component({
  selector: 'app-legend-dialog-button',
  templateUrl: '../legend-button/legend-button.component.html',
  styleUrls: ['../legend-button/legend-button.component.scss']
})

export class LegendDialogButtonComponent {

  public dialogRef = null;

  public tooltipDisabled = false;

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  public legendButtonTooltip = this.languageService.translate.instant('legend.open');

  @Output() toggleLegend = new EventEmitter<boolean>();

  constructor(public dialog: MatDialog, protected languageService: LanguageService) {}

  toggleLegendButton() {
    const dialogOpened = this.dialog.getDialogById('legend-dialog-container');
    //this.toggleLegend.emit();
      if (!dialogOpened) {
        this.legendButtonTooltip = this.languageService.translate.instant('legend.close');
        this.dialogRef = this.dialog.open(LegendDialogComponent, {
          id: 'legend-dialog-container',
          hasBackdrop: false,
          closeOnNavigation: true
        });
      } else {
        this.legendButtonTooltip = this.languageService.translate.instant('legend.open');
        this.dialogRef.close();
      }
  }

}
