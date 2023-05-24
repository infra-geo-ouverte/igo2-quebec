import { LanguageService } from '@igo2/core';
import { Component } from '@angular/core';
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

  public legendButtonTooltip = this.languageService.translate.instant('legend.open');

  constructor(public dialog: MatDialog, protected languageService: LanguageService) {}

  toggleLegendButton() {
    const dialogOpened = this.dialog.getDialogById('legend-dialog-container');
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
