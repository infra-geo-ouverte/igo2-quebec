import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LanguageService } from '@igo2/core';

@Component({
  selector: 'app-legend-panel-button',
  templateUrl: './legend-panel-button.component.html',
  styleUrls: ['./legend-panel-button.component.scss']
})
export class LegendPanelButtonComponent {

  @Output() toggleLegend = new EventEmitter<boolean>();

  @Input()
  get legendPanelOpened(): boolean {
    return this._legendPanelOpened;
  }
  set legendPanelOpened(value: boolean) {
    this._legendPanelOpened = value;
  }
  private _legendPanelOpened: boolean;

  constructor(protected languageService: LanguageService) { }

  toggleLegendPanel(): void {
      this.toggleLegend.emit();
  }
}
