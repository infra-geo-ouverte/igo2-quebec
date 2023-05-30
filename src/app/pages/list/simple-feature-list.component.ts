import { Feature } from 'geojson';
import { ConfigService } from '@igo2/core';
import { Component, Input, OnInit, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { EntityStore } from './shared/store';
import { SimpleFeatureList, AttributeOrder, SortBy, Paginator } from './simple-feature-list.interface';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-simple-feature-list',
  templateUrl: './simple-feature-list.component.html',
  styleUrls: ['./simple-feature-list.component.scss']
})

export class SimpleFeatureListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() entityStore: EntityStore; // a store that contains all the entities
  @Input() clickedEntities: Array<Feature>; // an array that contains the entities clicked in the map
  @Input() simpleFiltersValue: object; // an object containing the value of the filters
  @Output() listSelection = new EventEmitter(); // an event emitter that outputs the entity selected in the list

  public entitiesAll: Array<Feature>; // an array containing all the entities in the store
  public entitiesList: Array<Feature>; // an array containing all the entities in the list
  public entitiesShown: Array<Feature>; // an array containing the entities currently shown
  public entitiesList$: BehaviorSubject<Array<Feature>> = new BehaviorSubject([]); // an observable of an array of filtered entities
  public entitiesList$$: Subscription; // subscription to filtered list
  public entityIsSelected: boolean; // a boolean stating whether an entity has been selected in the list or not

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

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // get the entities from the layer/store
    this.entitiesAll = this.entityStore.entities$.getValue() as Array<Feature>;
    this.entitiesList = this.entityStore.entities$.getValue() as Array<Feature>;

    // get the config input by the user
    this.simpleFeatureListConfig = this.configService.getConfig('simpleFeatureList');

    // get the attribute order to use to display the elements in the list
    this.attributeOrder = this.simpleFeatureListConfig.attributeOrder;

    // get the sorting config and sort the entities accordingly (sort ascending by default)
    this.sortBy = this.simpleFeatureListConfig.sortBy;
    if (this.sortBy) {
      this.sortEntities(this.entitiesAll);
      this.sortEntities(this.entitiesList);
    }

    // get the formatting configs for URLs and emails (not formatted by default)
    this.formatURL = this.simpleFeatureListConfig.formatURL !== undefined ? this.simpleFeatureListConfig.formatURL : false;
    this.formatEmail = this.simpleFeatureListConfig.formatEmail !== undefined ? this.simpleFeatureListConfig.formatEmail : false;

    // if it exist, get the paginator config, including the page size, the buttons options and calculate the number of pages to use
    this.paginator = this.simpleFeatureListConfig.paginator;
    if (this.paginator) {
      // 5 elements displayed by default
      this.pageSize = this.paginator.pageSize !== undefined ? this.paginator.pageSize : 5;
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
      // if the most recent change is a filter change...
    } else if (changes.simpleFiltersValue) {
      if (!changes.simpleFiltersValue.firstChange) {
        const currentFiltersValue: object = changes.simpleFiltersValue.currentValue;
        let nonNullFiltersValue: Array<object> = [];

        // for each filter value...
        for (let filter in currentFiltersValue) {
          const currentFilterValue: any = currentFiltersValue[filter];
          // ...if the filter value is not null...
          if (currentFilterValue !== "" && currentFilterValue !== null) {
            // ...push the filter value in an array, then filter the entiites
            const filterValue: object = {};
            filterValue[filter] = currentFilterValue;
            nonNullFiltersValue.push(filterValue);
          }
        }
        this.filterEntities(nonNullFiltersValue);
      }
    }
  }

  ngOnDestroy() {
    this.currentPageNumber$$.unsubscribe();
    this.entitiesList$$.unsubscribe();
  }

  /**
   * @description Sort entities according to an attribute
   * @param entities The entities to sort
   */
  sortEntities(entities: Array<Feature>) {
    if (this.sortBy.order === undefined || this.sortBy.order === 'ascending') {
      entities.sort((a, b) => (a['properties'][this.sortBy.attributeName] > b['properties'][this.sortBy.attributeName]) ? 1 :
      ((b['properties'][this.sortBy.attributeName] > a['properties'][this.sortBy.attributeName]) ? -1 : 0));
    } else if (this.sortBy.order === 'descending') {
      entities.sort((a, b) => (a['properties'][this.sortBy.attributeName] > b['properties'][this.sortBy.attributeName]) ? -1 :
      ((b['properties'][this.sortBy.attributeName] > a['properties'][this.sortBy.attributeName]) ? 1 : 0));
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
    // if the attribute has a personnalized attribute input by the user in the config...
    if (attribute.personalizedFormatting) {
      newAttribute = this.createPersonalizedAttribute(entity, attribute.personalizedFormatting);
    // if the attribute is not personnalized...
    } else {
      newAttribute = this.checkAttributeFormatting(entity.properties[attribute.attributeName]);
    }
    return newAttribute;
  }

  /**
   * @description Create a personnalized attribute
   * @param entity The entity containing the attribute
   * @param personalizedFormatting The personnalized formatting specified by the user in the config
   * @returns A personnalized attribute
   */
  createPersonalizedAttribute(entity: Feature, personalizedFormatting: string): string {
    let personalizedAttribute: string = personalizedFormatting;

    // get the attributes for the personnalized attribute
    const attributeList: Array<string> = personalizedFormatting.match(/(?<=\[)(.*?)(?=\])/g);

    // for each attribute in the list...
    attributeList.forEach(attribute => {
      // ...get the attibute value, format it if needed and replace it in the string
      personalizedAttribute = personalizedAttribute.replace(attribute, this.checkAttributeFormatting(entity.properties[attribute]));
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
    if (match && this.formatEmail) {
      return `<a href="mailto:${match[0]}">Courriel</a>`;
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
    if (match && this.formatURL) {
      return `<a href="${match[0]}" target="_blank">Site Web</a>`;
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
    this.entitiesList$.next([entity]);
    this.entityIsSelected = true;

    // update the store and emit the entity to parent
    this.entityStore.state.updateAll({selected: false});
    this.entityStore.state.update(entity, {selected: true}, true);
    let entityCollection: {added: Array<Feature>} = {added: []};
    entityCollection.added.push(entity);
    this.listSelection.emit(entityCollection);
  }

  /**
   * @description Fired when the user unselects the entity in the list
   */
  unselectEntity(entity: Feature) {
    // show all entities
    this.entitiesList$.next(this.entitiesAll);
    this.entityIsSelected = false;
    this.currentPageNumber$.next(this.currentPageNumber$.getValue());
    this.entityStore.state.updateAll({selected: false});
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
  filterEntities(currentNonNullFiltersValue: Array<object>) {
    // if there is/are non null filter value(s)...
    if (currentNonNullFiltersValue.length) {
      let filteredEntities: Array<Feature> = [];
      // .. for each filter value...
      for (let currentFilterValue of currentNonNullFiltersValue) {
        const currentFilterValueKeys: Array<string> = Object.keys(currentFilterValue);
        for (let currentFilterValueKey of currentFilterValueKeys) {
          const currentFilterValueValue: any = currentFilterValue[currentFilterValueKey];
          // if the filter value is of type string (attribute filter)...
          if (typeof currentFilterValueValue === 'string') {
            for (let entity of this.entitiesAll) {
              const entityProperties: Array<string> = Object.keys(entity.properties);
              if (entityProperties.includes(currentFilterValueKey)) {
                if (entity.properties[currentFilterValueKey].toLowerCase().includes(currentFilterValueValue.toLowerCase())) {
                  filteredEntities.push(entity);
                }
              }
            }
            // if the filter value is of type object (spatial filter)...
          } else {
            // TODO
          }
        }
      }
      this.entitiesList$.next(filteredEntities);
    // if there is not any non null filter values, reset entities lsit
    } else {
      this.entitiesList$.next(this.entitiesAll);
    }
  }
}

