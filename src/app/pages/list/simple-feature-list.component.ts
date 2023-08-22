import { ConfigService, LanguageService, MessageService } from '@igo2/core';
import { Component, Input, OnInit, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { EntityStore } from './shared/store';
import { SimpleFeatureList, AttributeOrder, Paginator } from './simple-feature-list.interface';
import { BehaviorSubject, Subscription, map } from 'rxjs';
import { Option } from '../filters/simple-filters.interface';
import { ListEntitiesService } from './listServices/list-entities-services.service';
import { FilteredEntitiesService } from './listServices/filtered-entities.service';
import { FiltersActiveFiltersService } from '../filters/filterServices/filters-active-filters.service';
import { EntitiesAllService } from './listServices/entities-all.service';
import { Feature } from '@igo2/geo';
import { SortOptionsService } from './listServices/sort-options.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-simple-feature-list',
  templateUrl: './simple-feature-list.component.html',
  styleUrls: ['./simple-feature-list.component.scss']
})

export class SimpleFeatureListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entityStore: EntityStore; // a store that contains all the entities
  @Input() clickedEntities: Array<Feature>; // an array that contains the entities clicked in the map
  @Input() simpleFiltersValue: object; // an object containing the value of the filters
  @Input() terrAPITypes: Array<string>;
  @Input() additionalTypes: Array<string>;
  @Input() additionalProperties: Map<string, Map<string, string>>;
  @Input() entitiesAll: Array<Feature>; // an array containing all the entities in the store
  @Input() entitiesList: Array<Feature>;
  @Input() properties: Array<string>;
  @Output() listSelection = new EventEmitter(); // an event emitter that outputs the entity selected in the list

  public filterTypes: string[];
  public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
	public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API
  public entitiesShown: Array<Feature>; // an array containing the entities currently shown
  public entitiesList$: BehaviorSubject<Array<Feature>> = new BehaviorSubject([]); // an observable of an array of filtered entities
  public entitiesList$$: Subscription; // subscription to filtered list
  public selectedEntities: Array<Feature>; //entities selected in the map that will be displayed in the list (if it is defined)
  public selectedEntitiesList: boolean; //boolean to track when the list is generated by the selectedEntities and not by the entitiesList

  public simpleFeatureListConfig: SimpleFeatureList; // the simpleFeatureList config input by the user
  public attributeOrder: AttributeOrder; // the attribute order specified in the simpleFeatureList config
  public formatURL: boolean; // whether to format an URL or not, input in the SimpleFeature List config
  public formatEmail: boolean; // whether to format an email or not, input in the SimpleFeatureList config
  public paginator: Paginator; // the paginator config input, in the SimpleFeatureList Config

  public pageSize: number; // the number of elements in a page, input in the paginator config
  public showFirstLastPageButtons: boolean; // whether to show the First page and Last page buttons or not, input in the paginator config
  public showPreviousNextPageButtons: boolean; // whether to show the Previous page and Next Page buttons or not, input in the paginator config

  public currentPageNumber$: BehaviorSubject<number> = new BehaviorSubject(1); // observable of the current page number
  public currentPageNumber$$: Subscription; // subscription to the current page number
  public numberOfPages: number; // calculated number of pages
  public elementsLowerBound: number; // the lowest index (+ 1) of an element in the current page
  public elementsUpperBound: number; /// the highest index (+ 1) of an element in the current page

  public activeFilters: Map<string, Option[]> = new Map();
  public pageOptions: Array<number> =
    this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator.pageSizeOptions') !== undefined ?
    this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator.pageSizeOptions') : [5,10,25];
  public sortOptions: [string, string][];
  public undefinedConfig = this.languageService.translate.instant('simpleFeatureList.undefined');
  public firstSort = true;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private sortOptionsService: SortOptionsService,
    private entitiesAllService: EntitiesAllService,
    private filteredEntitiesService: FilteredEntitiesService,
    private languageService: LanguageService,
    private activeFilterService: FiltersActiveFiltersService,
    private entitiesListService: ListEntitiesService,
    private configService: ConfigService) {}

  async ngOnInit() {
    this.sortOptionsService.onEvent().subscribe( sortByOptions => {
      this.sortOptions = sortByOptions;
    });

    this.simpleFeatureListConfig = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList');

    this.entitiesListService.emitEvent(this.entitiesList);
    this.entitiesAllService.emitEvent(this.entitiesAll);

    // get the attribute order to use to display the elements in the list
    this.attributeOrder = this.simpleFeatureListConfig.attributeOrder;

    // get the formatting configs for URLs and emails (not formatted by default)
    this.formatURL = this.simpleFeatureListConfig.formatURL !== undefined ? this.simpleFeatureListConfig.formatURL : false;
    this.formatEmail = this.simpleFeatureListConfig.formatEmail !== undefined ? this.simpleFeatureListConfig.formatEmail : false;

    // if it exist, get the paginator config, including the page size, the buttons options and calculate the number of pages to use
    this.paginator = this.simpleFeatureListConfig.paginator;
    if (this.paginator) {
      // elements displayed by default
      if(this.pageOptions.includes(this.paginator.pageSize)){
        this.pageSize = this.paginator.pageSize;
      }else{
        this.pageSize = this.pageOptions[0];
      }
      // buttons shown by default
      this.showFirstLastPageButtons = this.paginator.showFirstLastPageButtons !== undefined ?
        this.paginator.showFirstLastPageButtons : true;
      this.showPreviousNextPageButtons = this.paginator.showPreviousNextPageButtons !== undefined ?
        this.paginator.showPreviousNextPageButtons : true;
      this.entitiesList$.next(this.entitiesList);
    // if the paginator config does not exist, all the entities are shown
    } else {
      this.entitiesShown = this.entitiesList;
    }

    // subscribe to the current page number
    this.currentPageNumber$$ = this.currentPageNumber$.subscribe((currentPageNumber: number) => {
      // calculate the new lower and upper bounds to display
      this.elementsLowerBound = (currentPageNumber - 1) * this.pageSize + 1;
      if(this.selectedEntities){
        this.elementsUpperBound = currentPageNumber * this.pageSize > this.selectedEntities.length ? this.selectedEntities.length :
          currentPageNumber * this.pageSize;
        // slice the entities to show the current ones
        this.entitiesShown = this.selectedEntities.slice(this.elementsLowerBound - 1, this.elementsUpperBound);
      }else{
        this.elementsUpperBound = currentPageNumber * this.pageSize > this.entitiesList.length ? this.entitiesList.length :
          currentPageNumber * this.pageSize;

        // slice the entities to show the current ones
        this.entitiesShown = this.entitiesList.slice(this.elementsLowerBound - 1, this.elementsUpperBound);
      }
    });

    // subscribe to the current entities list
    this.entitiesList$$ = this.entitiesList$.subscribe((entitiesList: Array<Feature>) => {
      this.selectedEntities = undefined;
      // replace the entities list
      this.entitiesList = entitiesList;
      // calculate new number of pages
      this.numberOfPages = Math.ceil(this.entitiesList.length / this.pageSize);
      // return to first page
      this.currentPageNumber$.next(1);
    });

    this.activeFilterService.onEvent().subscribe(activeFilters => {
      this.activeFilters = activeFilters;
      this.entitiesList$.next(this.filterEntities());
      if(this.selectedEntitiesList) this.clickedEntitiesOverridden();
      this.entitiesListService.emitEvent(this.entitiesList);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // if the most recent change is a click on entities on the map...
    if (changes.clickedEntities) {
      if (!changes.clickedEntities.firstChange) {
        // get array of clicked entities
        const clickedEntities: Array<Feature> = changes.clickedEntities.currentValue as Array<Feature>;

        // if an entity or entities have been clicked...
        if (clickedEntities !== undefined && clickedEntities?.length > 0) {
          this.selectedEntitiesList = true;
          // ...show current entities in list
          this.selectedEntities = clickedEntities;
          //temporarily override the entitiesShown with the selected entities
          this.numberOfPages = Math.ceil(this.selectedEntities.length / this.pageSize);
          this.entitiesShown = this.clickedEntities.slice(0, this.pageSize);
          // return to first page
          this.currentPageNumber$.next(1);
        // ...else show all entities in list
        } else {
          this.entitiesList$.next(this.entitiesAll);
        }
      }
    }
  }

  ngOnDestroy() {
    this.currentPageNumber$$.unsubscribe();
    this.entitiesList$$.unsubscribe();
  }

  //TODO
  private sortEntities(entities: Array<Feature>, sortBy: string) {
    if(this.selectedEntitiesList) this.clickedEntitiesOverridden();
    //types contained in terrapi
    if(this.additionalTypes && this.additionalTypes.includes(sortBy)) {
      entities.sort((a,b) => {
        let coordsA: string = a["geometry"]["coordinates"][0] + "," + a["geometry"]["coordinates"][1];
        let coordsB: string = b["geometry"]["coordinates"][0] + "," + b["geometry"]["coordinates"][1];
        try{
          let propA: Map<string, string> = this.additionalProperties.get(coordsA);
          let propB: Map<string, string> = this.additionalProperties.get(coordsB);

          let typeA = propA.get(sortBy);
          let typeB = propB.get(sortBy);

          return typeA > typeB ? 1 : typeA < typeB ? -1 : 0;
        } catch (error){
          //the only error that can occur is if the data is not initialized (from additionalProperties)
          this.messageService.error('simpleFeatureList.awaitInitialization');
        }

      });
    }
    else{
      entities.sort((a, b) => {
        return a['properties'][sortBy] > b['properties'][sortBy] ? 1 : a['properties'][sortBy] < b['properties'][sortBy] ? -1 : 0;
      });
    }
  }

  /**
   * @description Check if an attribute has to be formatted and format it if necessary
   * @param attribute A "raw" attribute from an entity
   * @returns A potentially formatted attribute
   */
  checkAttributeFormatting(attribute: any) {
    attribute = this.isPhoneNumber(attribute);
    attribute = this.isPostalCode(attribute);
    attribute = this.isURL(attribute);
    attribute = this.isEmail(attribute);

    return attribute ? attribute : this.undefinedConfig;
  }

  /**
   * @description Check if it is a valid attribute: if the attribute is part of the recognized types, it is valid,
   * and if it's a personalizedAttribute that contains at least one recognized type, it also is valid.
   * @param attribute The attribute to check
   * @returns A boolean indicating if the attribute should be displayed in the list
   */
  validAttribute(attribute: any): boolean {
    if(attribute.personalizedFormatting) {
      let attributeList: Array<string> = attribute.personalizedFormatting.match(/(?<=\[)(.*?)(?=\])/g);
      for(let type of attributeList){
        if(this.properties.includes(type) || this.additionalTypes.includes(type)){
          return true;
        }
      }
    }
    return this.properties.includes(attribute.type) || this.additionalTypes.includes(attribute.type);
  }

  /**
   * @description Create a personnalized attribute or a formatted attribute
   * @param entity An entity (feature)
   * @param attribute The attribute to get or to create
   * @returns The personnalized or formatted attribute as a string
   */
  createAttribute(entity: Feature, attribute: any): string {
    let newAttribute: string;

    if (attribute.personalizedFormatting) {
      newAttribute = this.createPersonalizedAttribute(entity, attribute.personalizedFormatting);
    }
    // if the attribute is not personnalized
    // it is assumed the type corresponds to a key that can be used in the entities list or with terrAPI
    else {
      if(entity.properties[attribute.type]){
        newAttribute = this.checkAttributeFormatting(entity.properties[attribute.type]);
      }else if(this.additionalTypes && this.additionalTypes.includes(attribute.type)){
        let coords: string = entity["geometry"]["coordinates"][0] + "," + entity["geometry"]["coordinates"][1];
        let attributeMap = this.additionalProperties.get(coords);
        if(attributeMap && attributeMap.get(attribute.type)){
          newAttribute = attributeMap.get(attribute.type);
        }
        else{
          newAttribute = this.undefinedConfig;
        }
      }
    }
    return newAttribute;
  }

  async getGeometryType(url: string){
    let response: Array<Feature>;

    await this.http.get<Array<Feature>>(url).pipe(map((features: Array<Feature>) => {
			response = features;
			return features;
		})).toPromise();

		return response;
  }

  /**
   * @description Create a personnalized attribute
   * @param entity The entity containing the attribute
   * @param terrAPIAttribute indicates if the attribute is from terrAPI or from the entities itself
   * @param personalizedFormatting The personnalized formatting specified by the user in the config
   * @returns A personnalized attribute
   */
  createPersonalizedAttribute(entity: Feature, personalizedFormatting: string): string {
    let personalizedAttribute: string = personalizedFormatting;

    // get the attributes for the personnalized attribute
    let attributeList: Array<string> = personalizedFormatting.match(/(?<=\[)(.*?)(?=\])/g);

    // for each attribute in the list...
    attributeList.forEach(attribute => {
      // get the attibute value, format it if needed and replace it in the string
      if(this.additionalTypes && this.additionalTypes.includes(attribute)){
        let coords: string = entity.geometry.coordinates.join(",");
        let nameMap = this.additionalProperties.get(coords);
        if(nameMap && nameMap.get(attribute)){
          personalizedAttribute = personalizedAttribute.replace(attribute, nameMap.get(attribute));
        }else{
          personalizedAttribute = personalizedAttribute.replace(attribute, this.undefinedConfig);
        }
      }else if(this.properties.includes(attribute)) {
        personalizedAttribute = personalizedAttribute.replace(attribute, this.checkAttributeFormatting(entity.properties[attribute]));
      }else{
        personalizedAttribute = personalizedAttribute.replace(attribute, this.checkAttributeFormatting(entity.properties[attribute]));
      }
    });
    // remove the square brackets surrounding the attributes
    personalizedAttribute = personalizedAttribute.replace(/[\[\]]/g, '');
    personalizedAttribute = personalizedAttribute.replace(/^([^A-zÀ-ÿ0-9])*|([^A-zÀ-ÿ0-9])*$/g, '');
    return personalizedAttribute;
  }

  /**
   * @description Format an attribute representing a phone number if the string matches the given pattern
   * @param attribute The attribute to format
   * @returns A formatted string representing a phone number or the original attribute
   */
  isPhoneNumber(attribute: any): any {
    let possiblePhoneNumber: string = ('' + attribute).replace(/\D/g, '');
    const match: Array<string> = possiblePhoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `<a href="tel:+1${match[0]}">(${match[1]}) ${match[2]}-${match[3]}</a>`;
    }
    return attribute;
  }

  /**
   * @description Format an attribute representing an email address if the string matches the given pattern
   * @param attribute The attribute to format
   * @returns A formatted string representing an email address or the original attribute
   */
  isEmail(attribute: any): any {
    let possibleEmail: string = '' + attribute;
    const match: Array<string> = possibleEmail.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);
    const message = this.languageService.translate.instant('simpleFeatureList.email');
    if (match && this.formatEmail) {
      return `<a href="mailto:${match[0]}">${message}</a>`;
    } else if (match && !this.formatEmail) {
      return `<a href="mailto:${match[0]}">${match[0]}</a>`;
    }
    return attribute;
  }

  /**
   * @description Format an attribute representing a postal code if the string matches the given pattern
   * @param attribute The attribute to format
   * @returns A formatted string representing a postal code or the original attribute
   */
  isPostalCode(attribute: any): any {
    let possiblePostalCode: string = '' + attribute;
    const match: Array<string> = possiblePostalCode.match(/^([A-CEGHJ-NPR-TVXY]\d[A-CEGHJ-NPR-TV-Z])[ -]?(\d[A-CEGHJ-NPR-TV-Z]\d)$/i);
    if (match) {
      return (match[1] + ' ' + match [2]).toUpperCase();
    }
    return attribute;
  }

  /**
   * @description Format an attribute representing an URL if the string matches the given pattern
   * @param attribute The attribute to format
   * @returns A formatted string representing an URL or the original attribute
   */
  isURL(attribute: any): any {
    let possibleURL: string = '' + attribute;
    const match: Array<string> = possibleURL.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    const message = this.languageService.translate.instant('simpleFeatureList.website');
    if (match && this.formatURL) {
      return `<a href="${match[0]}" target="_blank">${message}</a>`;
    } else if (match && !this.formatURL) {
      return `<a href="${match[0]}" target="_blank">${match[0]}</a>`;
    }
    return attribute;
  }

  /**
   * @description Fired when the user selects an entity in the list
   * @param entity
   */
  selectEntity(entity: Feature) {
    // update the store and emit the entity to parent
    // this.entityStore.state.updateAll({selected: false});
    // this.entityStore.state.update(entity, {selected: true}, true);
    let entityCollection: {added: Array<Feature>} = {added: []};
    entityCollection.added.push(entity);
    this.listSelection.emit(entityCollection);
  }

  /**
   * @description Fired when the user changes the page
   * @param currentPageNumber The current page number
   */
  onPageChange(currentPageNumber: number) {
    // update the current page number
    this.currentPageNumber$.next(currentPageNumber);
  }

  /**
   * @description Filter entities according to non null filter values
   * @param currentNonNullFiltersValue An array of objects containing the non null filter values
   */
  filterEntities(): Array<Feature> {
    //code for active filters map
    //set up a list of all entities that can be displayed and start shrinking it down
    // when filters do not have at least one filter from all filter categories (assuming there are is a filter selected in this category)
    let filteredEntities = this.entitiesAll as Array<Feature>;
    this.activeFilters.forEach((options, filter) => {
      //if options list is not empty, we must sift through our list
      if(options.length){

        //if the type is included in terrAPI (and has been added to additionalProperties map)
        if(this.additionalTypes.includes(filter)){

          let filteredAdditionalProperties: Array<[string, string]> = [];

          for(let entry of this.additionalProperties){
           if(entry[1].has(filter)){
            let id: string = entry[0];
            let terrAPINom: string = entry[1].get(filter);

            options.forEach(option => {
              if(option.nom === terrAPINom) {
                filteredAdditionalProperties.push([id, terrAPINom]);
              }
            });

           }
          }

          filteredEntities = filteredEntities.filter(element => filteredAdditionalProperties.some((property) => {
            let coords: string = element["geometry"]["coordinates"][0] + "," + element["geometry"]["coordinates"][1];
            return property[0] === coords;
          }));

        }
        //Otherwise the type is contained in the entities list
        else{
          filteredEntities = filteredEntities.filter(element => options.some((option) =>
          option.nom === element["properties"][filter]));
        }
      }
    });

    this.filteredEntitiesService.emitEvent(filteredEntities);
    return filteredEntities;
  }

  /**
   *
   * @param value the value we want to determine if it's an address.
   * @returns true if string has the form "[addresse + nom de rue], [municipalité] [code postal]"
   */
  public isAddress(value: string): boolean {
    const addressRegex = /^\d+\s[\w\s-]+,\s[\w\s-]+\s[A-Z]\d[A-Z]\d$/;
    return addressRegex.test(value);
  }

  public onSortSelection(sortBy: string){
    this.sortEntities(this.entitiesList, sortBy);
    this.sortEntities(this.entitiesAll, sortBy);

    this.entitiesList$.next(this.entitiesList);
  }

  public onPageSizeSelection(pageSize: number) {
    if(this.selectedEntitiesList){
      this.entitiesList$.next(this.entitiesList);
      this.clickedEntitiesOverridden();
    }
    this.pageSize = pageSize;
    // calculate new number of pages
    this.numberOfPages = Math.ceil(this.entitiesList.length / this.pageSize);
    // return to first page
    this.currentPageNumber$.next(1);
  }

  public clickedEntitiesOverridden(){
    this.messageService.alert("simpleFeatureList.selectOverridden");

    this.selectedEntitiesList = false;
  }

}

