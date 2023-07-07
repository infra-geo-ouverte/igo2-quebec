import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltersTypesService {

  private eventSubject = new Subject<string[]>();

  emitEvent(types: string[]) {
    this.eventSubject.next(types);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }}
