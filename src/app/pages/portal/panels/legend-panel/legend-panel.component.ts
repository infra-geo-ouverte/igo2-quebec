import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LanguageService } from '@igo2/core';

@Component({
  selector: 'app-legend-panel',
  templateUrl: '../../legend-button/legend-button.component.html',
  styleUrls: ['../../legend-button/legend-button.component.scss']
})
export class LegendPanelComponent {

  @Output() toggleLegend = new EventEmitter<boolean>();

  @Input()
  get tooltipDisabled(): boolean {
    return this._tooltipDisabled;
  }
  set tooltipDisabled(value: boolean) {
    this._tooltipDisabled = value;
  }
  private _tooltipDisabled: boolean;

  @Input()
  get legendButtonTooltip(): boolean {
    return this._legendButtonTooltip;
  }
  set legendButtonTooltip(value: boolean) {
    this._legendButtonTooltip = value;
  }
  private _legendButtonTooltip: boolean;

  constructor(protected languageService: LanguageService) { }

  toggleLegendButton(): void {
      this.toggleLegend.emit();
  }
}
