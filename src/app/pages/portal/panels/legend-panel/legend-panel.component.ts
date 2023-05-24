import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LanguageService } from '@igo2/core';

@Component({
  selector: 'app-legend-panel',
  templateUrl: '../../legend-button/legend-button.component.html',
  styleUrls: ['../../legend-button/legend-button.component.scss']
})
export class LegendPanelComponent {

  @Output() toggleLegend = new EventEmitter<boolean>();

  @Input() tooltipDisabled: boolean;

  @Input() legendButtonTooltip: boolean;

  constructor(protected languageService: LanguageService) { }

  toggleLegendButton(): void {
      this.toggleLegend.emit();
  }
}
