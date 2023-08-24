import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Option } from '../simple-filters.interface';

@Injectable({
  providedIn: 'root'
})
export class FiltersActiveFiltersService {

  private eventSubject = new Subject<Map<string, Option[]>>();

  emitEvent(activeFilters: Map<string, Option[]>) {
    this.eventSubject.next(activeFilters);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
