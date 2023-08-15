import { Component, Input, OnInit, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { Feature } from 'geojson';
import { TypeOptions, Option } from '../../filters/simple-filters.interface';
import { FiltersSortService } from '../../filters/filterServices/filters-sort-service.service';
import { FiltersPageService } from '../../filters/filterServices/filters-page-service.service';
import { FiltersOptionService } from '../../filters/filterServices/filters-option-service.service';
import { FiltersTypesService } from '../../filters/filterServices/filters-types.service';
import { ConfigService } from '@igo2/core';
import { SortOptionsService } from '../listServices/sort-options.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-simple-feature-list-header',
  templateUrl: './simple-feature-list-header.component.html',
  styleUrls: ['./simple-feature-list-header.component.scss']
})
export class SimpleFeatureListHeaderComponent implements OnInit, OnChanges {
  @Input() activeFilters: Map<string, TypeOptions[]>;
  @Input() entitiesList: Array<Feature>; // an array containing all the entities in the store
  @Input() elementsLowerBound: number; // the lowest index (+ 1) of an element in the current page
  @Input() elementsUpperBound: number; // the highest index (+ 1) of an element in the current page
  @Input() pageOptions: Array<number>; //array of page size options
  @Input() terrAPITypes: Array<string>;
  @Output() pageSizeSelected: EventEmitter<number> = new EventEmitter<number>();
  @Output() sortBySelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() additionalTypesDeclared: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  public entitiesLength: number;
  public properties: Array<string> = []; //property types that can be used for sorting

  public sortOptions: [string, string][];
  public defaultSortOption: string;
  public defaultSortCode: string = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.sortBy.default.attributeName');
  public defaultPageOption: number;
  public possibleSortOptions: [string, string][] = [];
  public additionalTypes: Array<string> = []; //array of all additional terrapi types that can be used

  constructor(
    private http: HttpClient,
    private sortOptionsService: SortOptionsService,
    private filterTypeService: FiltersTypesService,
    private filterOptionService: FiltersOptionService,
    private filterSortService: FiltersSortService,
    private filterPageService: FiltersPageService,
    private configService: ConfigService) { };

  async ngOnInit() {
    this.sortOptions = this.findSortOptions();
    this.sortOptionsService.emitEvent(this.sortOptions);

    if(this.defaultSortCode === undefined) {
      //default sort code doesn't exist, so we just take the first sort option and code from sortOptions
      this.defaultSortCode = this.sortOptions[0][0];
      this.defaultSortOption = this.sortOptions[0][1];
    }else{
      let valid = false;
      for(let sort of this.sortOptions){
        //find the sort option associated with the code
        if(sort[0] === this.defaultSortCode){
          valid = true;
          this.defaultSortOption = sort[1];
          break;
        }
      }

      if(!valid) {
        if(this.sortOptions[0]){
          //if the initial default option was not valid, reassign it to the first sort option and code from sortOptions
          this.defaultSortCode = this.sortOptions[0][0];
          this.defaultSortOption = this.sortOptions[0][1];
        }else{
          this.defaultSortCode = undefined;
          this.defaultSortOption = undefined;
        }
      }
    }

    this.sortBySelected.emit(this.defaultSortCode);

    let paginator = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator');
    this.defaultPageOption = paginator.pageSize !== undefined ? paginator.pageSize : this.pageOptions[0];

    // get the total number of entities
    this.entitiesLength = this.entitiesList.length;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entitiesList) {
      if (!changes.entitiesList.firstChange) {
        this.entitiesLength = changes.entitiesList.currentValue.length;
      }else{
        this.findProperties();
      }
    }
  }

  //find properties that are included in the entities list (which excludes terrapi types)
  public findProperties() {
    this.properties = Object.keys(this.entitiesList[0]["properties"]);
  }

  public findSortOptions(): [string, string][] {
    let attributes = this.configService.getConfig("useEmbeddedVersion.simpleFeatureList.sortBy.attributes");
    if(attributes === undefined) return [];

    let sortArray = [];

    //if there are elements in the attributeOrder config
    for(let i = 0; i < attributes.length; i++){
      let type: string = attributes[i]["type"];
      let description: string = attributes[i]["description"];
      let attribute = [type, description];

      //check that the type does not already exist in another tuple in the sortArray
      if(type !== undefined && !sortArray.some((tuple) => tuple[0] === type)) {
        if(this.properties.includes(type)){
          sortArray.push(attribute);
        }else if(this.terrAPITypes.includes(type)){
          sortArray.push(attribute);
        }
      }
    }
    return sortArray;
  }

  getNumActiveFilters() {
    return Array.from(this.activeFilters.values())
    .reduce((total, typeOptionsArray) => total + typeOptionsArray.length, 0);
  }

  removeFilter(option: Option) {
    this.filterOptionService.emitEvent(option);
  }

  onSortSelected(sortBy: string, sortOptions: [string, string][]) {
    let sort = sortOptions.find(element => element[1] === sortBy);
    this.filterSortService.emitEvent(sort[0]);
    this.sortBySelected.emit(sort[0]);
  }

  onPageSelected(size: number) {
    this.filterPageService.emitEvent(size);
    this.pageSizeSelected.emit(size);
  }
}
