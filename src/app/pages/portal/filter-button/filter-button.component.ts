import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { PanelsHandlerState } from '../panels/panels-handler/panels-handler.state';

@Component({
  selector: 'app-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.scss'],
  standalone: true,
  imports: [MatButton, MatTooltip, TranslateModule, AsyncPipe]
})
export class FilterButtonComponent {
  @Input() tooltipDisabled: boolean;
  @Output() filterToggled = new EventEmitter<boolean>();

  public dialogRef = null;
  public legendButtonTooltip: unknown;

  constructor(public panelsHandlerState: PanelsHandlerState) {}

  toggleFilter(): void {
    this.panelsHandlerState.shownComponent$;
    this.filterToggled.emit();
  }
}
