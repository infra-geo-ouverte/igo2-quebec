import { PropertiesMapService } from './filterServices/properties-map.service';
import { FiltersAdditionalTypesService } from './filterServices/filters-additional-types.service';
import { FiltersActiveFiltersService } from './filterServices/filters-active-filters.service';
import { FiltersSharedMethodsService } from './filterServices/filters-shared-methods.service';
import { FiltersAdditionalPropertiesService } from './filterServices/filters-additional-properties.service';
import { FeatureCollection } from 'geojson';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { SimpleFilter, TypeOptions, Option } from './simple-filters.interface';
import { ConfigService, LanguageService } from '@igo2/core';
import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subscription } from 'rxjs';
import { FiltersOptionService } from './filterServices/filters-option-service.service';
import { ListEntitiesService } from '../list/listServices/list-entities-services.service';
import { FiltersTypesService } from './filterServices/filters-types.service';
import { Feature } from '@igo2/geo';

@Component({
  selector: 'app-simple-filters',
  templateUrl: './simple-filters.component.html',
  styleUrls: ['./simple-filters.component.scss']
})
export class SimpleFiltersComponent implements OnInit, OnDestroy {
  @Input() isMobile: boolean;
  @Input() entityStore;
  @Input() terrAPITypes: Array<string>;
  @Output() filterSelection: EventEmitter<object> = new EventEmitter();
  @ViewChild(MatAutocompleteTrigger) panelTrigger: MatAutocompleteTrigger;
  @Input() entitiesAll: Array<Feature>; //entities
  @Input() entitiesList: Array<Feature>; //entities list provided by the service


  public simpleFiltersConfig: Array<SimpleFilter>; // simpleFilters config input by the user in the config file
  public allTypesOptions: Array<TypeOptions> = []; // array that contains all the options for each filter
  public filteredTypesOptions: Array<TypeOptions> = []; // array that contains the filtered options for each filter
  public filtersFormGroup: FormGroup; // form group containing the controls (one control per filter)
  public previousFiltersFormGroupValue: object; // object representing the previous value held in each control
  public filtersFormGroupValueChange$$: Subscription; // subscription to form group value changes
  public activeFilters: Map<string, Option[]> = new Map(); //map that contains all active filter options by type
  public filtersShown: boolean = false; //default status of filters in mobile mode
  public additionalTypes: Array<string> = []; //list of all additional filter types (corresponding to the keys of the map in additional properties)
  public additionalProperties: Map<string, Map<string, string>> = new Map(); //map of all additional properties by entity id e.g. {80029: {municipalite: Trois-Rivières}, {mrc: ...}}
  public properties: Array<string>; //string value of all properties that exist in the entities (e.g. "label", "nom", etc.)
  public propertiesMap: Map<string, Array<Option>> = new Map(); //string of all properties (keys) and all values associated with this property
  public filterTypes: Array<string> = [];
  public uniqueKey: string = this.configService.getConfig("useEmbeddedVersion.simpleFilters.uniqueAttribute");
  public undefinedConfig = this.languageService.translate.instant('simpleFeatureList.undefined');

  constructor(
    private languageService: LanguageService,
    private propertiesMapService: PropertiesMapService,
    private filterTypeService: FiltersTypesService,
    private additionalTypesService: FiltersAdditionalTypesService,
    private cdRef: ChangeDetectorRef,
    private activeFilterService: FiltersActiveFiltersService,
    private listEntitiesService: ListEntitiesService,
    private filterMethods: FiltersSharedMethodsService,
    private additionalPropertiesService: FiltersAdditionalPropertiesService,
    private configService: ConfigService,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private filterOptionService: FiltersOptionService) { };

  // getter of the form group controls
  get controls(): {[key: string]: AbstractControl} {
    return this.filtersFormGroup.controls;
  }

  public async ngOnInit(): Promise<void> {

    this.initializePropertiesMap();

    // get the simpleFilters config input by the user in the config file
    this.simpleFiltersConfig = this.configService.getConfig('useEmbeddedVersion.simpleFilters.filters');

    this.emptyActiveFilters();

    // create a form group used to hold various controls
    this.filtersFormGroup = this.formBuilder.group({});

    // for each filter input by the user...
    for (let filter of this.simpleFiltersConfig) {
      //check that only the types in terrapi and the entities list will be used
      if(filter.type && (this.propertiesMap.get(filter.type) !== undefined || (this.terrAPITypes.includes(filter.type) && this.uniqueKey))){
        // get the options from terrAPI and push them in the array containing all the options and add a control in the form group
        // typeoptions from terrAPI will have the optional list of options and those not from terrapi (from entitiesAll)
        // will need to get the optionsList prior to this function being called
        await this.getOptionsOfFilter(filter).then((typeOptions: TypeOptions) => {
          let temp: Array<Option> = [];
          if(typeOptions && typeOptions.options){
            let last: Option = undefined;
            for(let element of typeOptions.options){
              if(!last || element.nom !== last.nom){
                temp.push(element);
                last = element;
              }
            }
            typeOptions.options = temp;
          }

          //if no options are returned, don't add to the list of all types options
          //(e.g. terrapi sometimes is unable to find the info based on the type provided)
          if(typeOptions.options.length !== 0){
            this.allTypesOptions.push(typeOptions);
            this.filtersFormGroup.addControl(typeOptions.type, this.formBuilder.control(''));
          }
        });
      }
    }
    // deep-copy the array containing all the options to the one that will contain the filtered options (same at the start)
    this.filteredTypesOptions = JSON.parse(JSON.stringify(this.allTypesOptions));

    // set previous value of the form group (each control value is an empty string at the start)
    this.previousFiltersFormGroupValue = this.filtersFormGroup.value;

    // when the user types in a field, filter the options of the filter and emit the value of the filters
    this.filtersFormGroupValueChange$$ = this.filtersFormGroup.valueChanges.subscribe((spatialFiltersFormCurrentValue: object) => {
      this.filterOptions(spatialFiltersFormCurrentValue);
			this.filterSelection.emit(this.filtersFormGroup.value);
    });

    this.filterOptionService.onEvent().subscribe(event => {
      this.onSelection(event);
    });

    this.listEntitiesService.onEvent().subscribe(entitiesList => {
      this.entitiesList = entitiesList;
      this.updateCount();
    });

    this.updateCount();
  }

  public ngOnDestroy() {
    // unsubscribe from form group value change
    this.filtersFormGroupValueChange$$.unsubscribe();
  }

  /**
   * @description Used to display the name of a value in a field
   * @param value An object representing the current value of the control
   * @returns A string representing the value to display in the field
   */
  public displayName(value: Option): string {
    return value?.nom ? value.nom : '';
  }

  /**
   * @description Get all the options for a given filter
   * @param filter A SimpleFilter object representing the filter
   * @returns The options for the given filter in the TypeOptions format
   */
  private async getOptionsOfFilter(filter: SimpleFilter): Promise<TypeOptions> {
    let typeOptions: TypeOptions;

		// if type is included in the feature properties
    if (this.propertiesMap.has(filter.type)){
      this.filterTypes.push(filter.type);

    // Add the options from the entitiesAll, not from the terrAPI call
      let ops: Array<Option> = [];
      for(let property of this.propertiesMap.get(filter.type)){
        if(ops.filter( element => element.nom === property.nom && element.type === property.type).length === 0){
          let op: Option = {nom: property.nom, type: property.type};
          ops.push(op);
        }
      }
      typeOptions = {type: filter.type, description: filter.description, options: ops};
    }

    //need to also check if it is one of the location types that are accepted for the location terrapi call... can worry about this later
    else if (this.terrAPITypes.includes(filter.type)){
      this.filterTypes.push(filter.type);
      let options: Array<Option> = [];
      for(let entity of this.entitiesAll) {
        let longitude = entity["geometry"]["coordinates"][0];
        let latitude = entity["geometry"]["coordinates"][1];
        let coords: string = longitude + "," + latitude;
        await this.filterMethods.getLocationDataFromTerrAPI(filter.type, coords).then((featureCollection: FeatureCollection) => {
          if(featureCollection.features.length === 0){
            let locationData = this.undefinedConfig;
            let op: Option = {type: filter.type, nom: locationData};

            let coords: string = entity["geometry"]["coordinates"][0] + "," + entity["geometry"]["coordinates"][1];
            if(!this.additionalProperties.get(coords)){
              let newTypeMap: Map<string, string> = new Map();
              newTypeMap.set(filter.type, locationData);
              this.additionalProperties.set(coords, new Map(newTypeMap));
            }
            else{
              let oldMap = this.additionalProperties.get(coords);
              let newMap: Map<string, string> = new Map();
              newMap.set(filter.type, locationData);

              //combine the 2 maps
              const combinedMap = new Map([...oldMap, ...newMap]);
              this.additionalProperties.set(coords, new Map(combinedMap));

            }
            if(!this.additionalTypes.includes(filter.type)){
              this.additionalTypes.push(filter.type);
            }

            options.push(op);
          }
          featureCollection.features.forEach(feature => {
          // ...push type, code and name of each option
          let locationData = feature.properties.nom;

          if(typeof locationData === "string"){
            let op: Option = {type: filter.type, code: feature.properties.code, nom: feature.properties.nom};
            let coords: string = entity["geometry"]["coordinates"][0] + "," + entity["geometry"]["coordinates"][1];
            if(!this.additionalProperties.get(coords)){
              let newTypeMap: Map<string, string> = new Map();
              newTypeMap.set(filter.type, locationData);
              this.additionalProperties.set(coords, new Map(newTypeMap));
            }
            else{
              let oldMap = this.additionalProperties.get(coords);
              let newMap: Map<string, string> = new Map();
              newMap.set(filter.type, locationData);

              //combine the 2 maps
              const combinedMap = new Map([...oldMap, ...newMap]);
              this.additionalProperties.set(coords, new Map(combinedMap));

            }
            if(!this.additionalTypes.includes(filter.type)){
              this.additionalTypes.push(filter.type);
            }

            // the checks for duplicates is performed elsewhere so there is no need to re-check it here. assumed to be no duplicate elements
            options.push(op);
          }
          });
        });
      }
      this.additionalPropertiesService.emitEvent(this.additionalProperties);
      this.additionalTypesService.emitEvent(this.additionalTypes);
      this.filterTypeService.emitEvent(this.filterTypes);
      typeOptions = {type: filter.type, description: filter.description, options: options};
    }
		return typeOptions;
	}

  /**
   * @description Get the label of a given field
   * @param controlName A string representing the name of a control
   * @returns A string representing the label of a filter
   */
  public getLabel(controlName: string): string {
    // find and return the correct description
    return this.simpleFiltersConfig.find((filter: SimpleFilter) => filter.type === controlName).description;;
  }

  /**
   * @description Find and get the auto-complete options of a given field
   * @param formControlName A string representing the name of a control
   * @returns An array representing the options
   */
  public getOptions(formControlName: string): Array<Option> {
    let filteredOptions: Array<Option> = this.filteredTypesOptions.find(typeOptions => typeOptions.type === formControlName)?.options;

    //remove duplicates
    if(filteredOptions){
      const uniqueOptions = new Set();
      filteredOptions = filteredOptions.filter( option => {
        if(!uniqueOptions.has(option.nom)) {
          uniqueOptions.add(option.nom);
          return true;
        }
        return false;
      });
    }

    //Case where the options are not fetched from TerrAPI and need to be fetched from the entities
    if(filteredOptions === undefined && this.propertiesMap.has(formControlName)) {
      filteredOptions = this.propertiesMap.get(formControlName);
    }

    if(!Array.isArray(filteredOptions)){
      return filteredOptions;
    }
    else{
      let activeFilteredOptions: Array<Option> = this.activeFilters.get(formControlName);
      //runtime here could be improved if needed
      for(let element of filteredOptions) {
        for(let activeElement of activeFilteredOptions) {
          if(element.nom === activeElement.nom && element.type === activeElement.type){
            element.selected = activeElement.selected;
          };
        }
      }
    }
    //sort alphabetically
    return filteredOptions.sort((a,b) => a["nom"] > b["nom"] ? 1 : a["nom"] < b["nom"] ? -1 : 0);
  }

  /**
   * @description On selection of an option, filter options of other filters
   * @param event The event fired when selecting an option from auto-complete
   */
  public async onSelection(selectedOption: Option) {

    //return autocomplete form to prior state
    this.filtersFormGroup.reset();

    //Every time we select an option we toggle its selected status
    selectedOption.selected = !selectedOption.selected;

    // If it is not already in the activeFilters map, add it. Otherwise, remove it from activeFilters
    // Manually checking if it includes the selectedOption fields match any in the activeFilters map - except for selected field
    let matchingOptions = this.activeFilters.get(selectedOption.type).filter(element =>
      element.code === selectedOption.code && element.nom === selectedOption.nom && element.type === selectedOption.type);
    if(matchingOptions.length === 0) {
      this.activeFilters.get(selectedOption.type).push(selectedOption);
    }else {
      //remove element from activeFilters
      let temp = this.activeFilters.get(selectedOption.type);
      temp = temp.filter(element =>
        element.code !== selectedOption.code || element.nom !== selectedOption.nom || element.type !== selectedOption.type);
      this.activeFilters.set(selectedOption.type, temp);
    }
    this.activeFilterService.emitEvent(this.activeFilters);
    this.entitiesList = this.filterEntities();
    this.updateCount();
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

      return filteredEntities;
    }

  /**
   * @description Filter options as the user types characters in a field
   * @param currentFormGroupValue An object representing the current value of the form (and its controls)
   */
  private filterOptions(currentFormGroupValue: object) {
    // for every control in the from group...
    for (let control in currentFormGroupValue) {
      const currentControlValue: string = currentFormGroupValue[control];
      const previousControlValue: string = this.previousFiltersFormGroupValue[control];
      // ...if the current value of the control is not the same as the previous value of the control...
      if (currentControlValue !== previousControlValue && typeof currentControlValue === 'string') {
        // ...filter the options and make the previous form group value the current form group value
        const options: Array<Option> = this.allTypesOptions.find((typeOptions: TypeOptions) =>
          typeOptions.type === control
        ).options;
				if (options) {
					const filteredOptions: Array<Option> = options.filter((option: Option) => {
            if(typeof option.nom === "number"){
              return JSON.stringify(option.nom).includes(currentControlValue);
            }else{
              return option.nom.toLowerCase().includes(currentControlValue.toLowerCase());
            }
          }
					);
        	this.filteredTypesOptions.find((typeOptions: TypeOptions) => typeOptions.type === control).options = filteredOptions;
				}
      }
    }
    this.previousFiltersFormGroupValue = currentFormGroupValue;
    this.updateCount();
  }

  /**
   * @description Check if (a) value(s) is present in (a) field(s) to determine if buttons should be disabled
   * @returns A boolean representing if a button should be disabled or not
   */
  public areButtonsDisabled(): boolean {
    const formGroupValue: object = this.filtersFormGroup.value;
    let disabled: boolean = true;

    for (let control in formGroupValue) {
      if (typeof formGroupValue[control] === 'object' && formGroupValue[control] !== null) {
        disabled = false;
        break;
      }
    }

    return disabled;
  }

  /**
   * @description Reset/empty every field and reset the options
   */
  public async onResetFilters() {
    // reset the controls
    this.filtersFormGroup.reset();

    //reset active filters
    this.emptyActiveFilters(true);

    // deep-copy the array containing all the options
    this.filteredTypesOptions = JSON.parse(JSON.stringify(this.allTypesOptions));
    this.updateCount();
  }

    /**
   * @description Close autocomplete panel when it is opened
   */
  closeOpenPanel(isPanelOpen: boolean, event: Event): void {
    if(isPanelOpen) {
      event.stopPropagation();
      document.getElementById("click-to-close-mat-select").click();
    }
  }

    /**
   * @description Initialize/reset map so that it contains all required keys but with empty arrays
   */
  emptyActiveFilters(updateCount?: boolean) {
    for(let filter of this.simpleFiltersConfig) {
      this.activeFilters.set(filter.type, []);
    }

    this.activeFilterService.emitEvent(this.activeFilters);
    if(updateCount){
    this.entitiesList = this.entitiesAll;
    this.updateCount();
    }
  }

    /**
   * @description returns the length of the selected filter type
   */
  getSelectionCount(type: string): number {
    return this.activeFilters.get(type).length;
  }

  public updateCount() {
    for(let filter of this.filteredTypesOptions){
      let type: string = filter.type;

      //determine if we need to use additional properties or if it is contained in the entities list by default
      if(this.additionalTypes.includes(type)){
        for(let option of filter.options){
          option.count = 0;
          for(let entry of this.additionalProperties){
            let id = entry[0];
            for(let additionalProperty of entry[1]){
              if(additionalProperty[0] === type){
                if(additionalProperty[1] === option.nom) {
                  for(let entity of this.entitiesList){
                    let coords: string = entity["geometry"]["coordinates"][0] + "," + entity["geometry"]["coordinates"][1];
                    if(coords === id){
                      option.count++;
                    }
                  }
                }
              }
            }
          }
        }
      }else{
        for(let option of filter.options){
          option.count = 0;
          for(let entity of this.entitiesList){
            if(entity["properties"][type] === option.nom){
              option.count++;
            }
          }
        }
      }
    }
    this.cdRef.detectChanges();
  }

  public initializePropertiesMap() {
    let properties = Object.keys(this.entitiesAll[0]["properties"]);
    for(let property of properties){
      let values: Array<Option> = [];
      for(let entry of this.entitiesAll){
        let option: Option = {nom: entry["properties"][property], type: property};
        !values.includes(entry["properties"][property]) ? values.push(option) : undefined;
      }
      this.propertiesMap.set(property, values);
    }
    this.propertiesMapService.emitEvent(this.propertiesMap);
  }

}
