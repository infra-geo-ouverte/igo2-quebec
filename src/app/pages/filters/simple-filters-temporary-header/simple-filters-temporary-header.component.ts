import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TypeOptions, Option } from '../simple-filters.interface'
import { FilterService } from '../filters-service.service';


@Component({
  selector: 'app-simple-filters-temporary-header',
  templateUrl: './simple-filters-temporary-header.component.html',
  styleUrls: ['./simple-filters-temporary-header.component.scss']
})
export class SimpleFiltersTemporaryHeaderComponent {
  @Input() activeFilters: Map<string, TypeOptions[]>;
  @Output() optionSelected: EventEmitter<Option> = new EventEmitter<Option>();

  constructor(private filterService: FilterService) { }

  getNumActiveFilters() {
    return Array.from(this.activeFilters.values())
    .reduce((total, typeOptionsArray) => total + typeOptionsArray.length, 0);
  }

  removeFilter(option: Option) {
    this.filterService.emitEvent(option);
  }

}
