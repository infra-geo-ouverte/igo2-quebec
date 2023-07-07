import { Component, Input, OnInit, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { Feature } from 'geojson';
import { TypeOptions, Option } from '../../filters/simple-filters.interface'
import { FiltersSortService } from '../../filters/filterServices/filters-sort-service.service';
import { FiltersPageService } from '../../filters/filterServices/filters-page-service.service';
import { FiltersOptionService } from '../../filters/filterServices/filters-option-service.service';
import { FiltersTypesService } from '../../filters/filterServices/filters-types.service';
import { ConfigService } from '@igo2/core';
import { LanguageService } from '@igo2/core';

@Component({
  selector: 'igo-simple-feature-list-header',
  templateUrl: './simple-feature-list-header.component.html',
  styleUrls: ['./simple-feature-list-header.component.scss']
})
export class SimpleFeatureListHeaderComponent implements OnInit, OnChanges {
  @Input() activeFilters: Map<string, TypeOptions[]>;
  @Input() entitiesList: Array<Feature>; // an array containing all the entities in the store
  @Input() elementsLowerBound: number; // the lowest index (+ 1) of an element in the current page
  @Input() elementsUpperBound: number; // the highest index (+ 1) of an element in the current page
  @Input() pageOptions: Array<number>;  //array of page size options
  @Input() sortOptions: [string, string][]; //array of sorting options of the form ['Région', 'reg'], ['Numéro de Bureau', 'id'], ...
  @Output() pageSizeSelected: EventEmitter<number> = new EventEmitter<number>();
  @Output() sortBySelected: EventEmitter<string> = new EventEmitter<string>();

  public entitiesLength: number;

  public defaultSortOption: string;
  public defaultSortCode: string;
  public defaultPageOption: number;
  public possibleSortOptions: [string, string][] = [];

  constructor(private filterTypeService: FiltersTypesService, private filterOptionService: FiltersOptionService, private filterSortService: FiltersSortService, private filterPageService: FiltersPageService, private configService: ConfigService, private translateService: LanguageService) {  }

  ngOnInit() {

    this.defaultSortOption = this.sortOptions[0][1];
    this.defaultSortCode = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.sortBy.attributeName');

    // console.log("defaultSortCode ", this.defaultSortCode);

    this.filterTypeService.onEvent().subscribe( filterTypes => {
      // console.log("filterTypes event ", filterTypes);
      let filter: [string, string];
      for(let sortOption of filterTypes) {
        for(let option of this.sortOptions) {
          // console.log("option[0] ", option[0], " sortOption ", sortOption);
          if(option[0] === sortOption){
            filter = option;
          }
        }
        // let filter = this.sortOptions.find(filter => filter[0] === sortOption);
        // console.log("filterrrr ", filter);
        if(filter && !this.possibleSortOptions.includes(filter)){
          this.possibleSortOptions.push(filter);
        }
      }

      // console.log("possibleSortOptions ", this.possibleSortOptions);

      if(this.defaultSortCode === undefined) {
        this.defaultSortCode = this.sortOptions[0][0]
      }else{
        let valid = false;
        for(let sort of this.possibleSortOptions){
          if(sort[0] === this.defaultSortCode){
            valid = true;
          }
        }
        if(!valid) {
          this.defaultSortCode = this.sortOptions[0][0];
        }
      }

      let set = false;
      for(let possibleSortOption of this.possibleSortOptions){
        // console.log("possibleSortOption ", possibleSortOption);
        if(possibleSortOption[0] === this.defaultSortCode){
          // console.log("matched ", this.defaultSortCode);
          this.defaultSortOption = possibleSortOption[1];
          this.defaultSortCode = possibleSortOption[0];
          this.sortBySelected.emit(this.defaultSortCode);
          set = true;
        }
      }
      // console.log("set ", set);
      // console.log("defaultcode ", this.defaultSortCode);
      if(!set) {
        this.sortBySelected.emit(this.defaultSortCode);
      }
    });

    let paginator = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator')
    // this.defaultPageOption = this.pageOptions[0];
    this.defaultPageOption = paginator.pageSize !== undefined ? paginator.pageSize : this.pageOptions[0];


    // get the total number of entities
    this.entitiesLength = this.entitiesList.length;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entitiesList) {
      if (!changes.entitiesList.firstChange) {
        this.entitiesLength = changes.entitiesList.currentValue.length;
      }
    }
  }

  getNumActiveFilters() {
    return Array.from(this.activeFilters.values())
    .reduce((total, typeOptionsArray) => total + typeOptionsArray.length, 0);
  }

  removeFilter(option: Option) {
    console.log("removeFilter ", option);
    this.filterOptionService.emitEvent(option);
  }

  onSortSelected(sortBy: string, sortOptions: [string, string][]) {
    let sort = sortOptions.find(element => element[1] === sortBy);
    this.filterSortService.emitEvent(sort[0]);
    this.sortBySelected.emit(sort[0]);
    console.log("onSortSelected ", sort[0]);
  }

  onPageSelected(size: number) {
    this.filterPageService.emitEvent(size);
    this.pageSizeSelected.emit(size);
    console.log("onPageSelected ", size);
  }
}
