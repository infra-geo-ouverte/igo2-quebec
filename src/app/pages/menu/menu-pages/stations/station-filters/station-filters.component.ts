import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup } from '@angular/forms';
import { StationListService } from 'src/app/pages/shared/stations/station-list.service';
import {
  FiltersValues,
  Station,
  HttpOptions } from 'src/app/pages/shared/stations/stations.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-station-filters',
  templateUrl: './station-filters.component.html',
  styleUrls: ['./station-filters.component.scss']
})
export class StationFiltersComponent implements OnInit, OnDestroy {
  @Output() filterChange: EventEmitter<string> = new EventEmitter(); // emitted when the user checks/unchecks a filter value

  public filters: FormGroup; // filters form
  public filtersValueChange$$: Subscription // subscription to filters form value changes

  public filtersValues: FiltersValues = {etat: [], plan_deau: [], label: []} // values for all filters to display in respective selectors

  constructor(private fb: FormBuilder, private stationListService: StationListService) { }

  ngOnInit(): void {
    // construct form group (control names must be same as attribute name)
    this.filters = this.fb.group({
      etat: [],
      plan_deau: [],
      label: []
    });

    // when a filter value is checked/unchecked, contruct a new filters string
    this.filtersValueChange$$ = this.filters.valueChanges.subscribe((values: object) => {
      this.constructFiltersString(values);
    });

    // get all possible filters values
    this.getFiltersValues();
  }

  ngOnDestroy(): void {
    this.filtersValueChange$$.unsubscribe();
  }

  /**
   * @description get all possible filters values
   */
  getFiltersValues(): void {
    for (let [key, value] of Object.entries(this.filtersValues)) {
      const options: HttpOptions = {
        params: {
          order: key === "etat" ? key + ".desc" : key
        }
      };

      this.stationListService.getStationList(options).subscribe((stationList: Station[]) => {
        const stateList: number[] = [];
        for (let station of stationList) {
          // ...if the filter value is not already included in possible filters values, add it
          if (!this.filtersValues[key].includes(station[key])) {
            if (key === "etat" && !stateList.includes(station[key])) {
              const obj: object = {};
              const stateValue: number = station[key];
              obj["value"] = stateValue;
              if (stateValue === 0) {
                obj["string"] = "État inconnu";
              } else if (stateValue === 1) {
                obj["string"] = "État normal";
              } else if (stateValue === 2) {
                obj["string"] = "En surveillance";
              } else if (stateValue === 3) {
                obj["string"] = "Inondation mineure";
              } else if (stateValue === 4) {
                obj["string"] = "Inondation moyenne";
              } else if (stateValue === 5) {
                obj["string"] = "Inondation majeure";
              }
              this.filtersValues[key].push(obj);
              stateList.push(stateValue);
            } else if (key !== "etat") {
              this.filtersValues[key].push(station[key]);
            }
          }
        };
      });
    }
  }

  /**
   * @description construct filters string for API call
   * @param values selected values in filters
   */
  constructFiltersString(values: object): void {
    Object.keys(values).forEach(key => {
      if (values[key] === null) {
        delete values[key];
      }
    });
    let filtersString: string = "(";
    for (let [key, value] of Object.entries(values)) {
      if (value?.length) {
        filtersString += "or(";
        for (let v of value) {
          if (typeof v === "string") {
            filtersString += key + ".like." + v;
          } else {
            filtersString += key + ".eq." + v;
          }

          if (v === value.at(-1)) {
            filtersString += ")";
            const keys: string[] = Object.keys(values);
            if(key !== keys[keys.length - 1]) {
              filtersString += ",";
            }
          } else {
            filtersString += ",";
          }
        }
      }
    }
    filtersString += ")";

    this.filterChange.emit(filtersString);
  }

  /**
   * @description reset all filters
   */
  resetFilters(): void {
    this.filters.reset();
  }
}
