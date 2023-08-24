import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersSortService {

  private eventSubject = new Subject<string>();

  emitEvent(sortBy: string) {
    this.eventSubject.next(sortBy);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }}
