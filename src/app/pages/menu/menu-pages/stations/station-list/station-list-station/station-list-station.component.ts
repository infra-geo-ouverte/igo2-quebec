import { Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  AfterContentChecked } from '@angular/core';
import { Station } from 'src/app/pages/shared/stations/stations.interface';

@Component({
  selector: 'app-station-list-station',
  templateUrl: './station-list-station.component.html',
  styleUrls: ['./station-list-station.component.scss']
})
export class StationListStationComponent implements OnInit, AfterContentChecked {
  @Input() currentStation: Station; // current station

  private _stationStatesLegends: object; // object containing the state label and the corresponding legend

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this._stationStatesLegends = {
      0: {
        state: "État inconnu",
        legend: "assets/legends/legend-stations/etat-inconnu.svg"
      },
      1: {
        state: "État normal",
        legend: "assets/legends/legend-stations/etat-normal.svg"
      },
      2: {
        state: "En surveillance",
        legend: "assets/legends/legend-stations/surveillance.svg"
      },
      3: {
        state: "Inondation mineure",
        legend: "assets/legends/legend-stations/inondation-mineure.svg"
      },
      4: {
        state: "Inondation moyenne",
        legend: "assets/legends/legend-stations/inondation-moyenne.svg"
      },
      5: {
        state: "Inondation majeure",
        legend: "assets/legends/legend-stations/inondation-majeure.svg"
      }
    };
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  /**
   * @description go to station details page
   */
  onStationSelect() {
    console.log('Station select');
  }

  /**
   * @description get the state label
   * @param state the numeric equivalent of a state
   * @returns the corresponding label of the state
   */
  getStationState(state: number): string {
    return this._stationStatesLegends[state].state;
  }

  /**
   * @description get the state legend
   * @param state the numeric equivalent of a state
   * @returns the corresponding legend of the state
   */
  getStationStateLegend(state: number): string {
    return this._stationStatesLegends[state].legend;
  }

  /**
   * @description get the trend
   * @param previousValue previous value
   * @param currentValue current value
   * @returns trend
   */
  getTrend(previousValue: number, value: number): string {
    const delta: number = value - previousValue;

    if (delta < 0) {
      return "Baisse";
    } else if (delta > 0) {
      return "Hausse";
    } else {
      return "Stable";
    }
  }

  /**
   * @description format the date and time string
   * @param dateTime the date and time
   * @returns the formatted date and time
   */
  formatDateTime(dateTime: string): string {
    return dateTime.replace("T", ", ").substring(0, dateTime.length - 2);
  }
}
