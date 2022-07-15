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
import {
  BehaviorSubject,
  Subscription } from 'rxjs';

@Component({
  selector: 'app-station-list-paginator',
  templateUrl: './station-list-paginator.component.html',
  styleUrls: ['./station-list-paginator.component.scss']
})
export class StationListPaginatorComponent implements OnInit, AfterContentChecked, OnChanges, OnDestroy {
  @Input() currentPageNumber: number; // current page number
  @Input() currentTotalNumberOfStations: number; // current total number of stations
  @Input() currentNumberOfStationsPerPage: number; // current number of stations per page
  @Output() currentPageNumberChange: EventEmitter<number> = new EventEmitter(); // emitted when the current page number has changed

  public currentNumberOfPages: number; // current number of pages
  public pagesArray: number[]; // array of current page numbers
  public currentPageIsFirst: boolean; // whether the current page is the first one or not
  public currentPageIsLast: boolean; // whether the current page is the last one or not
  public currentPageNumber$: BehaviorSubject<number> = new BehaviorSubject(1); // current page number (default to 1 (first page))
  public currentPageNumber$$: Subscription; // subscription to current page number

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    // subscription to current page number
    this.currentPageNumber$$ = this.currentPageNumber$.subscribe((currentPageNumber: number) => {
      // set booleans accordingly
      if (currentPageNumber === 1) {
        this.currentPageIsFirst = true;
        this.currentPageIsLast = false;
      } else if (currentPageNumber === this.currentNumberOfPages) {
        this.currentPageIsFirst = false;
        this.currentPageIsLast = true;
      } else {
        this.currentPageIsFirst = false;
        this.currentPageIsLast = false;
      }
      this.currentPageNumberChange.emit(currentPageNumber);
    });
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if current page number changes...
    if (changes.currentPageNumber) {
      // ...update current page number
      this.currentPageNumber$.next(changes.currentPageNumber.currentValue);
    }

    // if current total number of stations has changed...
    if (changes.currentTotalNumberOfStations) {
      // ...calculate new number of pages
      this.setCurrentNumberOfPages(changes.currentTotalNumberOfStations.currentValue, this.currentNumberOfStationsPerPage);
    }

    // if current number of stations per page has changed...
    if (changes.currentNumberOfStationsPerPage) {
      // ...calculate new number of pages
      this.setCurrentNumberOfPages(this.currentTotalNumberOfStations, changes.currentNumberOfStationsPerPage.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.currentPageNumber$$.unsubscribe();
  }

  /**
   * @description go to previous page (substract 1 from current page number)
   */
  goToPreviousPage(): void {
    this.currentPageNumber$.next(this.getCurrentPageNumber() - 1);
  }

  /**
   * @description go to a specific page
   * @param event the event fired when changing page
   */
  goToPage(event: any): void {
    this.currentPageNumber$.next(parseInt(event.target.innerText));
  }

  /**
   * @description go to next page (add 1 to current page number)
   */
  goToNextPage(): void {
    this.currentPageNumber$.next(this.getCurrentPageNumber() + 1);
  }

  /**
   * @description get the current page number
   * @returns current page number
   */
  getCurrentPageNumber(): number {
    return this.currentPageNumber$.getValue();
  }

  /**
   * @description calculate the current number of pages and constrcut the corresponding array
   * @param currentTotalNumberOfStations current total number of stations
   * @param currentNumberOfStationsPerPage current number of stations per page
   */
  setCurrentNumberOfPages(currentTotalNumberOfStations: number, currentNumberOfStationsPerPage: number): void {
    this.currentNumberOfPages = Math.ceil(currentTotalNumberOfStations / currentNumberOfStationsPerPage);

    if (this.currentNumberOfPages) {
      this.pagesArray = Array(this.currentNumberOfPages).fill(1).map((x,i) => i);
    }
  }
}
