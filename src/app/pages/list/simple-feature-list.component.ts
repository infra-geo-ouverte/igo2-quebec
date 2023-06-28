import { Feature } from 'geojson';
import { ConfigService } from '@igo2/core';
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

@Component({
  selector: 'app-simple-feature-list',
  templateUrl: './simple-feature-list.component.html',
  styleUrls: ['./simple-feature-list.component.scss']
})

export class SimpleFeatureListComponent implements OnInit, OnChanges, OnDestroy {
  // @Input() entityStore: EntityStore; // a store that contains all the entities
  // @Input() clickedEntities: Array<Feature>; // an array that contains the entities clicked in the map
  @Input() simpleFiltersValue: object; // an object containing the value of the filters
  @Output() listSelection = new EventEmitter(); // an event emitter that outputs the entity selected in the list
  @Input() activeFilters: Map<string, Option[]>;
  @Input() propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property

	public terrAPIBaseURL: string = "https://geoegl.msp.gouv.qc.ca/apis/terrapi/"; // base URL of the terrAPI API
  public entitiesAll: Array<Object>; // an array containing all the entities in the store
  public entitiesList: Array<Object>; // an array containing all the entities in the list
  public entitiesShown: Array<Object>; // an array containing the entities currently shown
  public entitiesList$: BehaviorSubject<Array<Object>> = new BehaviorSubject([]); // an observable of an array of filtered entities
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

  public additionalProperties: Map<number, Map<string,string>>;
  public pageOptions: Array<number> = [1,2,5,10,25];  //page size options
  public sortOptions: [string, string][] = this.configService.getConfig('useEmbeddedVersion.simpleFilters').map(filter => [filter.type, filter.description]);  //sort options of the form ['Région', 'reg'], ['Numéro de Bureau', 'id'], ...

  constructor(private listEntitiesService: ListEntitiesService, private configService: ConfigService, private filterAdditionalPropertiesService: FiltersAdditionalPropertiesService, private filterPageService: FiltersPageService, private filterSortService: FiltersSortService) {}

  ngOnInit(): void {
    //set additionalProperties when they get created in the filters component
    this.filterAdditionalPropertiesService.onEvent().subscribe( event => this.additionalProperties = event );

    // get the entities from the layer/store
    // this.entitiesAll = this.entityStore.entities$.getValue() as Array<Feature>;
    // this.entitiesList = this.entityStore.entities$.getValue() as Array<Feature>;

    this.simpleFeatureListConfig = this.configService.getConfig('useEmbeddedVersion.simpleFeatureList');

    this.entitiesAll = this.configService.getConfig('temporaryEntitiesAll') as Array<Object>;
    this.entitiesList = this.configService.getConfig('temporaryEntitiesAll') as Array<Object>;

    console.log(this.entitiesAll);
    console.log(this.entitiesList);

    // get the attribute order to use to display the elements in the list
    this.attributeOrder = this.simpleFeatureListConfig.attributeOrder;
    console.log("attributeOrder ", this.attributeOrder);

    // get the sorting config and sort the entities accordingly (sort ascending by default)
    this.sortBy = this.simpleFeatureListConfig.sortBy;
    if (this.sortBy) {
      this.sortEntities(this.entitiesAll, this.sortBy.attributeName);
      this.sortEntities(this.entitiesList, this.sortBy.attributeName);
    }

    // get the formatting configs for URLs and emails (not formatted by default)
    this.formatURL = this.simpleFeatureListConfig.formatURL !== undefined ? this.simpleFeatureListConfig.formatURL : false;
    this.formatEmail = this.simpleFeatureListConfig.formatEmail !== undefined ? this.simpleFeatureListConfig.formatEmail : false;

    // if it exist, get the paginator config, including the page size, the buttons options and calculate the number of pages to use
    this.paginator = this.simpleFeatureListConfig.paginator;
    if (this.paginator) {
      console.log("paginator");
      // elements displayed by default
      this.pageSize = this.paginator.pageSize !== undefined ? this.paginator.pageSize : this.pageOptions[0];
      // buttons shown by default
      this.showFirstLastPageButtons = this.paginator.showFirstLastPageButtons !== undefined ?
        this.paginator.showFirstLastPageButtons : true;
      this.showPreviousNextPageButtons = this.paginator.showPreviousNextPageButtons !== undefined ?
        this.paginator.showPreviousNextPageButtons : true;
      this.entitiesList$.next(this.entitiesList);
      console.log("entitiesList ", this.entitiesList$);
    // if the paginator config does not exist, all the entities are shown
    } else {
      console.log("no paginator");
      this.entitiesShown = this.entitiesList;
      console.log("entitiesShown 1 ", this.entitiesShown);
    }

    // this.listEntitiesService.emitEvent(this.entitiesList);


    // subscribe to the current page number
    this.currentPageNumber$$ = this.currentPageNumber$.subscribe((currentPageNumber: number) => {
      // calculate the new lower and upper bounds to display
      this.elementsLowerBound = (currentPageNumber - 1) * this.pageSize + 1;
      this.elementsUpperBound = currentPageNumber * this.pageSize > this.entitiesList.length ? this.entitiesList.length :
        currentPageNumber * this.pageSize;

      // slice the entities to show the current ones
      this.entitiesShown = this.entitiesList.slice(this.elementsLowerBound - 1, this.elementsUpperBound);
      console.log("entitiesShown 2 ", this.entitiesShown);
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

    // this.filterSortService.onEvent().subscribe(sortBy => {
    //   // Handle the emitted event
    //   console.log('sort received:', sortBy);
    //   console.log("event type: ", typeof sortBy)
    // });

    // this.filterPageService.onEvent().subscribe(pageSize => {
    //   // Handle the emitted event
    //   console.log('page received:', pageSize);
    //   console.log("event type: ", typeof pageSize);
    //   this.pageSize = pageSize;
    //   // this.paginator.pageSize = pageSize;
    // });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("ngOnChanges ", changes);
    // if the most recent change is a click on entities on the map...
    if (changes.clickedEntities) {
      if (!changes.clickedEntities.firstChange) {
        console.log("clickedEntities not first change");
        // // change selected state to false for all entities
        // this.entityStore.state.updateAll({selected: false});
        // // get array of clicked entities
        // const clickedEntities: Array<Feature> = changes.clickedEntities.currentValue as Array<Feature>;
        // // if an entity or entities have been clicked...
        // if (clickedEntities?.length > 0 && clickedEntities !== undefined) {
        //   // ...show current entities in list
        //   this.entityStore.state.updateMany(clickedEntities, {selected: true});
        //   this.entitiesList$.next(clickedEntities);
        // // ...else show all entities in list
        // } else {
        //   this.entitiesList$.next(this.entitiesAll);
        // }
      }
      // if the most recent change is a filter change...
    } else if (changes.simpleFiltersValue) {
      console.log("simpleFiltersValue changes");
      // if (!changes.simpleFiltersValue.firstChange) {
        // const currentFiltersValue: object = changes.simpleFiltersValue.currentValue;
        // let nonNullFiltersValue: Array<object> = [];

        // // for each filter value...
        // for (let filter in currentFiltersValue) {
        //   const currentFilterValue: any = currentFiltersValue[filter];
        //   // ...if the filter value is not null...
        //   if (currentFilterValue !== "" && currentFilterValue !== null) {
        //     // ...push the filter value in an array, then filter the entiites
        //     const filterValue: object = {};
        //     filterValue[filter] = currentFilterValue;
        //     nonNullFiltersValue.push(filterValue);
        //   }
        // }


        // let filters = Array.from(this.activeFilters.values()).reduce(
        //   (result, arr) => result.concat(arr),
        //   []
        // );
        // console.log("nonNullFiltersValue: ", filters);
        this.entitiesList$.next(this.filterEntities());
        // this.listEntitiesService.emitEvent(this.entitiesList);
      // }
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
  private async sortEntities(entities: Array<Object>, sortBy: string) {
    //perform swapping
    console.log("list before ", entities);

    if(sortBy === "municipalites"){
      //TODO - no idea yet how to do this with async stuff and the promises...
      console.log("MUNUNUN")
      console.log(entities.length);
      let munA: string;
      let munB: string;


      // entities.sort((a, b) => {
      //   this.filterMethods.getMunicipality("municipalites", a['properties']['coordonnees']).subscribe(
      //     (municipality: string) => {
      //       munA = municipality;
      //       console.log("Municipality:", municipality);
      //     },
      //   );
      //   this.filterMethods.getMunicipality("municipalites", b['properties']['coordonnees']).subscribe(
      //     (municipality: string) => {
      //       munB = municipality;
      //       console.log("Municipality:", municipality);
      //     },
      //   );
      //   // let munA: string = this.filterMethods.getMunicipality("municipalites", a['properties']['coordonnees']);
      //   // let munB: string = this.filterMethods.getMunicipality("municipalites", b['properties']['coordonnees']);
      //   console.log("munA ", munA, " munB ", munB);
      //   return munB > munB ? 1 : munA < munB ? -1 : 0;
      // });

      // entities.sort(async (a,b) => {
      //   await this.filterMethods.getMunicipalityFromTerrAPI(sortBy, a["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //     featureCollection.features.forEach(feature => {munA = feature.properties.nom; })});
      //   await this.filterMethods.getMunicipalityFromTerrAPI(sortBy, b["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //     featureCollection.features.forEach(feature => {munB = feature.properties.nom; })});
      //   console.log("munA ", munA, " munB ", munB);
      //   console.log("swapping ", munA > munB);
      //   return Promise.resolve(munA && munB ? (munA > munB ? 1 : munA < munB ? -1 : 0) : 0);
      //   }).
        // return munA > munB ? 1 : munA < munB ? -1 : 0; })
        // .then(featureCollection: FeatureCollection => {


        //this approach works for identifying which elements need to be swapped but it doesn't actually swap them... idk why
        // for (let i = 0; i < entities.length - 1; i++) {
        //   for (let j = 0; j < entities.length - i - 1; j++) {
        //     await Promise.all([
        //       this.filterMethods.getMunicipalityFromTerrAPI(sortBy, entities[j]["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
        //         featureCollection.features.forEach(feature => {
        //           munA = feature.properties.nom;
        //           console.log("munAAA", munA);
        //         });
        //       }),
        //       this.filterMethods.getMunicipalityFromTerrAPI(sortBy, entities[j + 1]["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
        //         featureCollection.features.forEach(feature => {
        //           munB = feature.properties.nom;
        //           console.log("munBBB", munB);
        //         });
        //       })
        //     ]);
        //     if (munA > munB) {
        //       console.log("[i] ", entities[j])
        //       console.log("[i+1] ", entities[j+1])
        //       console.log("swapping before ", entities)
        //       // Swap elements
        //       const temp = entities[j];
        //       entities[j] = entities[j + 1];
        //       entities[j + 1] = temp;
        //       console.log("swapping after ", entities)
        //     }
        //   }
        // }

        // entities.sort((a, b) => {
        //   let munA: string;
        //   let munB: string;
        
        //   return Promise.all([
        //     this.filterMethods.getMunicipalityFromTerrAPI(sortBy, a["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
        //       featureCollection.features.forEach(feature => {
        //         munA = feature.properties.nom;
        //         console.log("munAAA", munA);
        //       });
        //     }),
        //     this.filterMethods.getMunicipalityFromTerrAPI(sortBy, b["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
        //       featureCollection.features.forEach(feature => {
        //         munB = feature.properties.nom;
        //         console.log("munBBB", munB);
        //       });
        //     })
        //   ]).then(() => {
        //     console.log("munA ", munA, " munB ", munB);
        //     return munA > munB ? 1 : munA < munB ? -1 : 0;
        //   });
        // });
        



      // for (let i = 0; i < entities.length - 1; i++) {
      //   await this.filterMethods.getMunicipalityFromTerrAPI(sortBy, entities[i]["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //     featureCollection.features.forEach(feature => {
      //       munA = feature.properties.nom;
      //       console.log("munAAA ", munA);
      //     });
      //   });
      //   for(let j = 1; j < entities.length; j++) {
      //     await this.filterMethods.getMunicipalityFromTerrAPI(sortBy, entities[i+1]["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //       featureCollection.features.forEach(feature => {
      //         munB = feature.properties.nom;
      //         console.log("munBBB ", munB);
      //       });
      //     });
      //     if(munA > munB){
      //       //perform swap
      //       let temp = entities[i];
      //       entities[i] = entities[j];
      //       entities[j] = temp;
      //     }
      //   }
      // }


        // entities.sort((a, b) => (munA > munB) ? 1 :
        // ((munB > munA) ? -1 : 0));
        // return  munA > munB ? 1 : munA < munB ? -1 : 0;

      // }
      // entities.sort((a, b) => {
      //   let munA: string; // Declare munA without assigning a value
      //   await this.filterMethods.getMunicipalityFromTerrAPI(sortBy, a["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //     featureCollection.features.forEach(feature => {
      //       munA = feature.properties.nom; // Assign the value to munA
      //     });
      //   });
      //   let munB: string; // Declare munA without assigning a value

      //   this.filterMethods.getMunicipalityFromTerrAPI(sortBy, b["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
      //     featureCollection.features.forEach(feature => {
      //       munB = feature.properties.nom; // Assign the value to munA
      //     });
        // });
        // this.filterMethods.getMunicipalityFromTerrAPI(sortBy, b["properties"]["coordonnees"]).then((featureCollection: FeatureCollection) => {
        //   featureCollection.features.forEach(feature => { munB = feature.properties.nom })});

    //     console.log("munA ", munA, " munB ", munB);
    //   });
    }else{
        entities.sort((a, b) => {
        return a['properties'][sortBy] > b['properties'][sortBy] ? 1 : a['properties'][sortBy] < b['properties'][sortBy] ? -1 : 0;
      });
    }
    console.log("list after ", entities);
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
    console.log("selectEntity");
    // this.entitiesList$.next([entity]);
    // this.entityIsSelected = true;

    // // update the store and emit the entity to parent
    // this.entityStore.state.updateAll({selected: false});
    // this.entityStore.state.update(entity, {selected: true}, true);
    // let entityCollection: {added: Array<Feature>} = {added: []};
    // entityCollection.added.push(entity);
    // this.listSelection.emit(entityCollection);
  }

  /**
   * @description Fired when the user unselects the entity in the list
   */
  unselectEntity(entity: Feature) {
    console.log("unselectEntity");
    // show all entities
    // this.entitiesList$.next(this.entitiesAll);
    // this.entityIsSelected = false;
    // this.currentPageNumber$.next(this.currentPageNumber$.getValue());
    // this.entityStore.state.updateAll({selected: false});
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
  filterEntities(): Array<Object> {
    //code for active filters map
    //set up a list of all entities that can be displayed and start shrinking it down when filters do not have at least one filter from all filter categories (assuming there are is a filter selected in this category)
    let filteredEntities = this.entitiesAll;
    this.activeFilters.forEach((options, filter) => {
      //if options list is not empty, we must sift through our list
      if(options.length){
        if(filter === "municipalites"){

          let filteredAdditionalProperties: Array<[number, string]> = [];

          for(let entry of this.additionalProperties){
           if(entry[1].has(filter)){
            let id: number = entry[0];
            let mun: string = entry[1].get("municipalites");
            // console.log("entry[1] ", entry[1]);
            // console.log("entry[0] ", entry[0]);
            // console.log("entity ", entity)
            // console.log("filteredEntities: ", filteredEntities);

            options.forEach(option => {
              if(option.nom === mun) {
                filteredAdditionalProperties.push([id, mun]);
              }
            });

           }
          }

          filteredEntities = filteredEntities.filter(element => filteredAdditionalProperties.some((property) => {
            return property[0] === element["properties"]["id"];
          }));

        }else{
          //element["properties"][filter] ==> 802004 for example
          //options: [{type: id, selected: true, nom: 80437}, ...] - nom depends on the filter selected
          filteredEntities = filteredEntities.filter(element => options.some((option) =>
          option.nom === element["properties"][filter]));
          console.log("siftedEntities ", filteredEntities);
        }
      }
    });
    return filteredEntities;

    // this.entitiesList$.next(filteredEntities);





    //everything below this point was uncommented in the old way of doing it...
    //TODO - make the code above work better than the code below :D
    //code for flattened array (problem: does not consider if a displayed entity corresponds to at least one filter from all filter categories - it just checks if it corresponds to one)
    // if there is/are non null filter value(s)...
    // if (currentNonNullFiltersValue.length) {
    //   let filteredEntities: Array<Object> = [];
    //   // .. for each filter value...
    //   for (let currentFilter of currentNonNullFiltersValue) {
    //     console.log("currentFilterValue ", currentFilter);
    //     const currentFilterType: string = currentFilter.type;
    //     const currentFilterValue: string = currentFilter.nom;
    //     console.log("currentFilterValueValue: ", currentFilterValue);

    //     // if the filter value is of type string (attribute filter)...
    //     for (let entity of this.entitiesAll) {

    //     //First, consider if propertiesMap contains the type in question
    //       if(this.propertiesMap.has(currentFilterType)){
    //         console.log("filtertype ", currentFilterType);
    //         const entityProperties: Array<string> = Object.keys(entity["properties"]);
    //         if (entityProperties.includes(currentFilterType)) {
    //           if (typeof entity["properties"][currentFilterType] === "string" && entity["properties"][currentFilterType].toLowerCase().includes(currentFilterValue.toLowerCase()) && !filteredEntities.includes(entity)) {
    //             filteredEntities.push(entity);
    //           }else if(typeof entity["properties"][currentFilterType] === "number" && entity["properties"][currentFilterType] === currentFilterValue && !filteredEntities.includes(entity)){
    //             filteredEntities.push(entity);
    //           }
    //         }
    //       }
    //       //Second, check if the type is a location type (municipality) and determine which filter corresponds to this location if so using terrAPI
    //       else if (currentFilterType === "municipalites") {
    //         for(let entry of this.additionalProperties){
    //           let entity = this.getEntityById(entry[0]);
    //           if(entry[1].has(currentFilterType) && entry[1].get(currentFilterType) === currentFilterValue && !filteredEntities.includes(entity)){
    //             filteredEntities.push(entity);
    //             console.log("yay! ", entry, " has currentfiltervalue ", currentFilterValue);
    //             console.log(this.getEntityById(entry[0]));
    //           }
    //         }
    //       }else{
    //         console.log("fucked")
    //       }
    //     }
      // }

      // this.entitiesList$.next(filteredEntities);
    // if there is not any non null filter values, reset entities list
    // } else {
    //   this.entitiesList$.next(this.entitiesAll);
    // }
  }

  /**
   *
   * @param id unique id of the entity in the entitieslist
   * @returns the entity associated to the unique id
   */
  public getEntityById(id: number) {
    for(let entity of this.entitiesAll){
      if(entity["properties"]["id"] === id){
        return entity;
      }
    }
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
    console.log("sort by ", sortBy);
    console.log("entities before ", this.entitiesAll);
    this.sortEntities(this.entitiesList, sortBy);
    this.sortEntities(this.entitiesAll, sortBy);
    console.log("entities after ", this.entitiesAll);
    this.entitiesList$.next(this.entitiesList);
    // this.listEntitiesService.emitEvent(this.entitiesList);
  }

  public onPageSizeSelection(pageSize: number) {
    console.log("page size ", pageSize);
    this.pageSize = pageSize;
    // refresh entitieslist based on the new page size (refreshing causes the )
    // calculate new number of pages
    this.numberOfPages = Math.ceil(this.entitiesList.length / this.pageSize);
    // return to first page
    this.currentPageNumber$.next(1);
  }
}

