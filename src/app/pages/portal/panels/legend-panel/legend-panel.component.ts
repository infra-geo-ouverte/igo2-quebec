import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-legend-panel',
  templateUrl: '../../legend-button/legend-button.component.html',
  styleUrls: ['../../legend-button/legend-button.component.scss']
})
export class LegendPanelComponent {

  @Output() toggleLegend = new EventEmitter<boolean>();

  @Input() tooltipDisabled: boolean;

  @Input() legendButtonTooltip: boolean;

  constructor() { }

  toggleLegendButton(): void {
      this.toggleLegend.emit();
  }
}
