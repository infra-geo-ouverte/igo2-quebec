import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Option } from '../simple-filters.interface';

@Injectable({
  providedIn: 'root'
})
export class PropertiesMapService {

  private eventSubject = new Subject<Map<string, Array<Option>>>();

  emitEvent(propertiesMap: Map<string, Array<Option>>) {
    this.eventSubject.next(propertiesMap);
  }

  onEvent() {
    return this.eventSubject.asObservable();
  }}
