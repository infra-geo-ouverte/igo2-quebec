import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';

import { LanguageService } from '@igo2/core/language';

import { TranslateModule } from '@ngx-translate/core';

import { LegendDialogComponent } from '../legend-dialog/legend-dialog.component';

@Component({
  selector: 'app-legend-button',
  templateUrl: './legend-button.component.html',
  styleUrls: ['./legend-button.component.scss'],
  standalone: true,
  imports: [MatButton, MatTooltip, TranslateModule]
})
export class LegendButtonComponent implements OnInit {
  @Output() legendToggled = new EventEmitter<boolean>();
  @Input() tooltipDisabled: boolean;
  @Input() legendInPanel: boolean;
  @Input() mobile: boolean;

  public dialogRef = null;
  public legendButtonTooltip: unknown;

  constructor(
    public dialog: MatDialog,
    protected languageService: LanguageService
  ) {}

  ngOnInit() {
    this.legendButtonTooltip =
      this.languageService.translate.instant('legend.open');
  }

  toggleLegend(): void {
    if (!this.legendInPanel && !this.mobile) {
      const dialogOpened = this.dialog.getDialogById('legend-dialog-container');
      if (!dialogOpened) {
        this.legendButtonTooltip =
          this.languageService.translate.instant('legend.close');
        this.dialogRef = this.dialog.open(LegendDialogComponent, {
          id: 'legend-dialog-container',
          hasBackdrop: false,
          closeOnNavigation: true
        });
      } else {
        this.legendButtonTooltip =
          this.languageService.translate.instant('legend.open');
        this.dialogRef.close();
      }
    }
    this.legendToggled.emit();
  }
}
