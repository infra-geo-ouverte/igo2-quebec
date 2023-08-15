import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Option } from '../simple-filters.interface';

@Injectable({
  providedIn: 'root'
})
export class FiltersOptionService {
  private eventSubject = new Subject<Option>();

  emitEvent(option: Option) {
    this.eventSubject.next(option);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }
}
