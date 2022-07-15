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
import { MatSelectChange } from '@angular/material/select';
import {
  BehaviorSubject,
  Subscription } from 'rxjs';

@Component({
  selector: 'app-station-list-header',
  templateUrl: './station-list-header.component.html',
  styleUrls: ['./station-list-header.component.scss']
})
export class StationListHeaderComponent implements OnInit, AfterContentChecked, OnChanges, OnDestroy {
  @Input() currentTotalNumberOfStations: number; // current total number of stations (displayed)
  @Input() currentPageNumber: number; // current page number
  @Output() currentOrderChange: EventEmitter<string> = new EventEmitter(); // emitted when a new order is selected (current order is changed)
  @Output() currentNumberOfStationsPerPageChange: EventEmitter<number> = new EventEmitter(); // emitted when a new number of stations per page is selected
  @Output() selectorChange: EventEmitter<number> = new EventEmitter() // emitted when a value is change in a selector

  public lowerBound: number; // lower bound of current stations shown (displayed)
  public upperBound: number; // upper bound of current stations shown (displayed)

  public orders: object[]; // object representing the orders displayed in the respective selector
  public numberOfStationsPerPageOptions: number[]; // object representing options for number of stations per page to be displayed in the respective selector

  public currentOrder$: BehaviorSubject<string> = new BehaviorSubject('etat.desc'); // current order (state descending by default)
  public currentOrder$$: Subscription; // subscription to current order

  public currentNumberOfStationsPerPage$: BehaviorSubject<number> = new BehaviorSubject(10); // current number of stations per page (10 by default)
  public currentNumberOfStationsPerPage$$: Subscription; // subscription to current number of stations per page

  public show: boolean = false; // to hide order selector for now

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.orders = [
      {value: 'etat.desc', label: 'État'},
      {value: 'label', label: 'Station'},
      {value: 'valeur.desc.nullslast', label: 'Niveau'}
    ]; // orders to be shown in selector

    this.numberOfStationsPerPageOptions = [10, 25, 50]; // number of stations per page to be shown in selector

    // subscription to current order
    this.currentOrder$$ = this.currentOrder$.subscribe((currentOrder: string) => {
      this.currentOrderChange.emit(currentOrder);
      this.selectorChange.emit(1);
    });

    // subscription to current number of stations per page
    this.currentNumberOfStationsPerPage$$ = this.currentNumberOfStationsPerPage$.subscribe((currentNumberOfStationsPerPage: number) => {
      this.lowerBound = this.getCurrentLowerBound(this.currentPageNumber); // calculate new lower bound
      this.upperBound = this.getCurrentUpperBound(this.currentPageNumber, this.currentTotalNumberOfStations); // calculate new upper bound
      this.currentNumberOfStationsPerPageChange.emit(currentNumberOfStationsPerPage);
      this.selectorChange.emit(1);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if current page number has changed...
    if (changes.currentPageNumber) {
      // ...calculate new lower and upper bounds
      const currentPageNumber = changes.currentPageNumber.currentValue;
      this.lowerBound = this.getCurrentLowerBound(currentPageNumber);
      this.upperBound = this.getCurrentUpperBound(currentPageNumber, this.currentTotalNumberOfStations);
    }

    // if current total number of stations has changed...
    if (changes.currentTotalNumberOfStations) {
      // ...calculate new lower and upper bounds
      const totalNumberOfStations = changes.currentTotalNumberOfStations.currentValue;
      this.lowerBound = this.getCurrentLowerBound(this.currentPageNumber);
      this.upperBound = this.getCurrentUpperBound(this.currentPageNumber, totalNumberOfStations);
    }
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  ngOnDestroy(): void {
    this.currentOrder$$.unsubscribe();
    this.currentNumberOfStationsPerPage$$.unsubscribe();
  }

  /**
   * @description get the current number of stations per page
   * @returns current number of stations per page
   */
  getCurrentNumberOfStationsPerPage(): number {
    return this.currentNumberOfStationsPerPage$.getValue();
  }

  /**
   * @description get the current lower bound
   * @param currentPageNumber current page number
   * @returns current lower bound
   */
  getCurrentLowerBound(currentPageNumber: number): number {
    return ((currentPageNumber - 1) * this.getCurrentNumberOfStationsPerPage()) + 1;
  }

  /**
   * @description get the current upper bound
   * @param currentPageNumber current page number
   * @param currentTotalNumberOfStations total number of stations
   * @returns current upper bound
   */
  getCurrentUpperBound(currentPageNumber: number, currentTotalNumberOfStations: number): number {
    // calculate the theoretical upper bound
    const upperBound: number = currentPageNumber * this.getCurrentNumberOfStationsPerPage();

    // if the theoretical upper bound is larger than the current total number of stations...
    if (upperBound > currentTotalNumberOfStations) {
      // ...return the current total number of stations
      return currentTotalNumberOfStations;
    } else {
      // ..else return the theoretical upper bound
      return upperBound;
    }
  }

  /**
   * @description update the current order
   * @param event event fired when a new order is selected
   */
  changeCurrentOrder(event: MatSelectChange): void {
    this.currentOrder$.next(event.value);
  }

  /**
   * @description update the current number of stations per page
   * @param event event fired when a new number of stations per page is selected
   */
  changeCurrentNumberOfStationsPerPage(event: MatSelectChange): void {
    this.currentNumberOfStationsPerPage$.next(event.value);
  }
}
