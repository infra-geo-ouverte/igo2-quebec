import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
  AfterContentChecked } from '@angular/core';
import { StationListService } from './../../../../shared/stations/station-list.service';
import {
  HttpOptions,
  Station } from './../../../../shared/stations/stations.interface';
import {
  BehaviorSubject,
  Subscription } from 'rxjs';

@Component({
  selector: 'app-station-list',
  templateUrl: './station-list.component.html',
  styleUrls: ['./station-list.component.scss']
})
export class StationListComponent implements OnInit, AfterContentChecked, OnChanges, OnDestroy {
  @Input() currentOrder: string; // current order
  @Input() currentPageNumber: number; // current page number
  @Input() currentNumberOfStationsPerPage: number; // current number of stations per page
  @Input() currentFiltersString: string; // current filter string
  @Output() currentTotalNumberOfStationsChange: EventEmitter<number> = new EventEmitter(); // emitted when the current total number of stations has changed
  @Output() currentNumberOfStationsChange: EventEmitter<number> = new EventEmitter(); // emitted when the current number of stations has changed

  public stationList: Station[] = []; // station list

  public currentTotalNumberOfStations$: BehaviorSubject<number> = new BehaviorSubject(undefined); // current total number of stations
  public currentTotalNumberOfStations$$: Subscription; // subscription to current total number of stations

  constructor(private stationListService: StationListService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    // get the current total number of stations
    this.getCurrentTotalNumberOfStations();

    // subscription to current total number of stations
    this.currentTotalNumberOfStations$$ = this.currentTotalNumberOfStations$.subscribe((currentTotalNumberOfStations: number) => {
      this.currentTotalNumberOfStationsChange.emit(currentTotalNumberOfStations);
    });
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if the current order / the current number / stations per page / the current page number / the current filters string has changed...
    if (changes.currentOrder) {
      // ...update station list
      this.getStationList(changes.currentOrder.currentValue, this.currentNumberOfStationsPerPage,
        this.currentPageNumber, this.currentFiltersString);
    } else if (changes.currentNumberOfStationsPerPage) {
      this.getStationList(this.currentOrder, changes.currentNumberOfStationsPerPage.currentValue,
        this.currentPageNumber, this.currentFiltersString);
    } else if (changes.currentPageNumber) {
      this.getStationList(this.currentOrder, this.currentNumberOfStationsPerPage,
        changes.currentPageNumber.currentValue, this.currentFiltersString);
    } else if (changes.currentFiltersString) {
      this.getStationList(this.currentOrder, this.currentNumberOfStationsPerPage,
        this.currentPageNumber, changes.currentFiltersString.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.currentTotalNumberOfStations$$.unsubscribe();
  }

  /**
   * @description get current total number of stations
   */
  getCurrentTotalNumberOfStations(currentFiltersString?: string): void {
    const options: HttpOptions = {
      params: {}
    };

    if (currentFiltersString !== "()" && currentFiltersString !== undefined) {
      options.params["and"] = currentFiltersString;
    }

    this.stationListService.getStationList(options).subscribe((stationList: Station[]) => {
      this.currentTotalNumberOfStations$.next(stationList.length);
    });
  }

  /**
   * @description get the station list from API
   * @param currentOrder current order
   * @param currentNumberOfStationsPerPage current number of stations per page
   * @param currentPageNumber current page number
   * @param currentFiltersString current filters string
   */
  getStationList(currentOrder: string, currentNumberOfStationsPerPage: number,
    currentPageNumber: number, currentFiltersString: string): void {
    // set options
    const options: HttpOptions = {
      params: {
        order: currentOrder,
        limit: currentNumberOfStationsPerPage,
        offset: (currentPageNumber - 1) * currentNumberOfStationsPerPage
      }
    };

    // set filter string if there are any filters
    if (currentFiltersString !== "()" && currentFiltersString !== undefined) {
      options.params["and"] = currentFiltersString;
    }

    // make call to API
    this.stationListService.getStationList(options).subscribe((stationList: Station[]) => {
      this.stationList = stationList;

      this.getCurrentTotalNumberOfStations(currentFiltersString);
    });
  }
}
