import {
  Component,
  ChangeDetectorRef,
  AfterContentChecked } from '@angular/core';

@Component({
  selector: 'app-stations',
  templateUrl: './stations.component.html',
  styleUrls: ['./stations.component.scss']
})
export class StationsComponent implements AfterContentChecked {
  public currentOrder: string; // current order
  public currentNumberOfStationsPerPage: number; // current number of stations per page
  public currentTotalNumberOfStations: number; // current total number of stations
  public currentPageNumber: number; // current page number

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  /**
   * @description set current total number of stations
   * @param currentTotalNumberOfStations current total number of pages
   */
  setCurrentTotalNumberOfStations(currentTotalNumberOfStations: number): void {
    this.currentTotalNumberOfStations = currentTotalNumberOfStations;
  }

  /**
   * @description set current order
   * @param currentOrder current order
   */
  setCurrentOrder(currentOrder: string): void {
    this.scrollToTopOfList();
    this.currentOrder = currentOrder;
  }

  /**
   * @description set current number of stations per page
   * @param currentNumberOfStationsPerPage current number of stations per page
   */
  setCurrentNumberOfStationsPerPage(currentNumberOfStationsPerPage: number): void {
    this.scrollToTopOfList();
    this.currentNumberOfStationsPerPage = currentNumberOfStationsPerPage;
  }

  /**
   * @description set current page number
   * @param currentPageNumber current page number
   */
  setCurrentPageNumber(currentPageNumber: number): void {
    this.scrollToTopOfList();
    this.currentPageNumber = currentPageNumber;
  }

  scrollToTopOfList(): void {
    const div: HTMLElement = document.getElementById("list");
    div.scrollTop = 0;
  }
}
