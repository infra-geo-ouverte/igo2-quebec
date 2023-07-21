import { Meta } from '@angular/platform-browser';
import { ConfigService, LanguageService, IgoLanguageModule } from '@igo2/core';
import { Component, Input, OnInit, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { EntityStore } from './shared/store';
import { SimpleFeatureList, AttributeOrder, SortBy, Paginator } from './simple-feature-list.interface';
import { BehaviorSubject, Subscription, map } from 'rxjs';
import { FiltersPageService } from '../filters/filterServices/filters-page-service.service';
import { FiltersSortService } from '../filters/filterServices/filters-sort-service.service';
import { Option } from '../filters/simple-filters.interface';
import { FiltersAdditionalPropertiesService } from '../filters/filterServices/filters-additional-properties.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FiltersSharedMethodsService } from '../filters/filterServices/filters-shared-methods.service';
import { ListEntitiesService } from './listServices/list-entities-services.service';
import { FilteredEntitiesService } from './listServices/filtered-entities.service';
import { FiltersActiveFiltersService } from '../filters/filterServices/filters-active-filters.service';
import { FiltersAdditionalTypesService } from '../filters/filterServices/filters-additional-types.service';
import { FiltersTypesService } from '../filters/filterServices/filters-types.service';
import { EntitiesAllService } from './listServices/entities-all.service';
import { Feature } from '@igo2/geo';

@Component({
  selector: 'app-simple-feature-list',
  templateUrl: './simple-feature-list.component.html',
  styleUrls: ['./simple-feature-list.component.scss']
})

export class SimpleFeatureListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entityStore: EntityStore; // a store that contains all the entities
  @Input() clickedEntities: Array<Feature>; // an array that contains the entities clicked in the map
  @Input() entitiesList: Array<Feature>
  @Input() simpleFiltersValue: object; // an object containing the value of the filters
  @Output() listSelection = new EventEmitter(); // an event emitter that outputs the entity selected in the list

  public clickedEntitiesUpdated: Array<Feature> = [];
  public filterTypes: string[];
  public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
	public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API
  public entitiesAll: Array<Feature>; // an array containing all the entities in the store
  public entitiesShown: Array<Feature>; // an array containing the entities currently shown
  public entitiesList$: BehaviorSubject<Array<Feature>> = new BehaviorSubject([]); // an observable of an array of filtered entities
  public entitiesList$$: Subscription; // subscription to filtered list

  public simpleFeatureListConfig: SimpleFeatureList; // the simpleFeatureList config input by the user
  public attributeOrder: AttributeOrder; // the attribute order specified in the simpleFeatureList config
  public sortBy: SortBy; // the sorting to use, input in the SimpleFeatureList config
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
  public additionalProperties: Map<string, Map<string,string>>;
  public additionalTypes: Array<string>;
  public pageOptions: Array<number> = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator.pageSizeOptions') !== undefined ? this.configService.getConfig('useEmbeddedVersion.simpleFeatureList.paginator.pageSizeOptions') : [1,2,5,10,25];
  public sortOptions: [string, string][] = this.configService.getConfig('useEmbeddedVersion.simpleFilters') !== undefined ? this.configService.getConfig('useEmbeddedVersion.simpleFilters').map(filter => [filter.type, filter.description] ) : [];


  constructor(private entitiesAllService: EntitiesAllService, private filteredEntitiesService: FilteredEntitiesService, private languageService: LanguageService, private additionalTypesService: FiltersAdditionalTypesService,private activeFilterService: FiltersActiveFiltersService, private listEntitiesService: ListEntitiesService, private configService: ConfigService, private filterAdditionalPropertiesService: FiltersAdditionalPropertiesService, private filterPageService: FiltersPageService, private filterSortService: FiltersSortService) {}

  ngOnInit(): void {
    //set additionalProperties when they get created in the filters component
    this.filterAdditionalPropertiesService.onEvent().subscribe( event => {
      this.additionalProperties = event; });

    // get the entities from the layer/store
    this.entitiesAll = this.entityStore.entities$.getValue() as Array<Feature>;
    this.entitiesList = this.entityStore.entities$.getValue() as Array<Feature>;

    this.simpleFeatureListConfig = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList');

    this.listEntitiesService.emitEvent(this.entitiesList);
    this.entitiesAllService.emitEvent(this.entitiesAll);

    // get the attribute order to use to display the elements in the list
    this.attributeOrder = this.simpleFeatureListConfig.attributeOrder;

    // get the sorting config and sort the entities accordingly (sort ascending by default)
    this.sortBy = this.simpleFeatureListConfig.sortBy;
    if (this.sortBy) {
      this.sortEntities(this.entitiesList, this.sortBy.attributeName);
      this.sortEntities(this.entitiesAll, this.sortBy.attributeName);
    }

    // get the formatting configs for URLs and emails (not formatted by default)
    this.formatURL = this.simpleFeatureListConfig.formatURL !== undefined ? this.simpleFeatureListConfig.formatURL : false;
    this.formatEmail = this.simpleFeatureListConfig.formatEmail !== undefined ? this.simpleFeatureListConfig.formatEmail : false;

    // if it exist, get the paginator config, including the page size, the buttons options and calculate the number of pages to use
    this.paginator = this.simpleFeatureListConfig.paginator;
    if (this.paginator) {
      // elements displayed by default
      this.pageSize = this.paginator.pageSize !== undefined ? this.paginator.pageSize : this.pageOptions[0];
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
      this.elementsUpperBound = currentPageNumber * this.pageSize > this.entitiesList.length ? this.entitiesList.length :
        currentPageNumber * this.pageSize;

      // slice the entities to show the current ones
      this.entitiesShown = this.entitiesList.slice(this.elementsLowerBound - 1, this.elementsUpperBound);
    });

    // subscribe to the current entities list
    this.entitiesList$$ = this.entitiesList$.subscribe((entitiesList: Array<Feature>) => {
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
      this.listEntitiesService.emitEvent(this.entitiesList);
    });

    this.additionalTypesService.onEvent().subscribe( types => {
      this.additionalTypes = types;
    })

    let properties = Object.keys(this.entitiesAll[0]["properties"]);
    for(let property of properties){
      let values: Array<Option> = [];
      for(let entry of this.entitiesAll){
        let option: Option = {nom: entry["properties"][property], type: property};
        !values.includes(entry["properties"][property]) ? values.push(option) : undefined;
      }
      this.propertiesMap.set(property, values);
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    // if the most recent change is a click on entities on the map...
    if (changes.clickedEntities) {
      if (!changes.clickedEntities.firstChange) {
        // change selected state to false for all entities
        this.entityStore.state.updateAll({selected: false});
        // get array of clicked entities
        const clickedEntities: Array<Feature> = changes.clickedEntities.currentValue as Array<Feature>;

        // if an entity or entities have been clicked...
        if (clickedEntities?.length > 0 && clickedEntities !== undefined) {
          // ...show current entities in list
          this.entityStore.state.updateMany(clickedEntities, {selected: true});
          this.entitiesList$.next(clickedEntities);
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

  private sortEntities(entities: Array<Feature>, sortBy: string) {
    if(this.additionalTypes && this.additionalTypes.includes(sortBy)) {
      entities.sort((a,b) => {
        let coordsA: string = a["geometry"]["coordinates"][0] + "," + a["geometry"]["coordinates"][1];
        let coordsB: string = b["geometry"]["coordinates"][0] + "," + b["geometry"]["coordinates"][1];

        let propA: Map<string, string> = this.additionalProperties.get(coordsA);
        let propB: Map<string, string> = this.additionalProperties.get(coordsB);

        let munA = propA.get(sortBy);
        let munB = propB.get(sortBy);

        return munA > munB ? 1 : munA < munB ? -1 : 0;
      });
    }
    //types contained in terrapi
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

    return attribute;
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
        newAttribute = this.createPersonalizedAttribute(entity, attribute.personalizedFormatting, false);
    }
    // if the attribute is not personnalized, it is assumed the attributeName corresponds to a key that can be used in the entities list or with terrAPI
    else {
      if(entity.properties[attribute.attributeName]){
        if (attribute.attributeName === "courriel") {
        }
        newAttribute = this.checkAttributeFormatting(entity.properties[attribute.attributeName]);
      }else if(this.additionalTypes && this.additionalTypes.includes(attribute.attributeName)){
        let coords: string = entity["geometry"]["coordinates"][0] + "," + entity["geometry"]["coordinates"][1];
        newAttribute = this.additionalProperties.get(coords).get(attribute.attributeName);
      }
    }
    return newAttribute;
  }

  /**
   * @description Create a personnalized attribute
   * @param entity The entity containing the attribute
   * @param terrAPIAttribute indicates if the attribute is from terrAPI or from the entities itself
   * @param personalizedFormatting The personnalized formatting specified by the user in the config
   * @returns A personnalized attribute
   */
  createPersonalizedAttribute(entity: Feature, personalizedFormatting: string, terrAPIAttribute: boolean): string {
    let personalizedAttribute: string = personalizedFormatting;

    // get the attributes for the personnalized attribute
    const attributeList: Array<string> = personalizedFormatting.match(/(?<=\[)(.*?)(?=\])/g);

    // for each attribute in the list...
    attributeList.forEach(attribute => {
      // ...get the attibute value, format it if needed and replace it in the string
      if(this.additionalTypes && this.additionalTypes.includes(attribute)){
        personalizedAttribute = personalizedAttribute.replace(attribute, this.additionalProperties.get(entity.properties["id"]).get(attribute));
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
    const match: Array<string> = possibleEmail.match(/(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);
    const message = this.languageService.getLanguage() === "fr" ? "Courriel" : "Email"
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
    const message = this.languageService.getLanguage() === "fr" ? "Site Web" : "Website"
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
    //set up a list of all entities that can be displayed and start shrinking it down when filters do not have at least one filter from all filter categories (assuming there are is a filter selected in this category)
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
            let mun: string = entry[1].get(filter);

            options.forEach(option => {
              if(option.nom === mun) {
                filteredAdditionalProperties.push([id, mun]);
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
          //element["properties"][filter] ==> 802004 for example
          //options: [{type: id, selected: true, nom: 80437}, ...] - nom depends on the filter selected
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
    this.sortEntities(this.entitiesAll, sortBy)
    this.entitiesList$.next(this.entitiesList);
  }

  public onPageSizeSelection(pageSize: number) {
    this.pageSize = pageSize;
    // refresh entitieslist based on the new page size (refreshing causes the )
    // calculate new number of pages
    this.numberOfPages = Math.ceil(this.entitiesList.length / this.pageSize);
    // return to first page
    this.currentPageNumber$.next(1);
  }
}

