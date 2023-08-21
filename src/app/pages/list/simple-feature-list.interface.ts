import { SimpleFilter } from '../filters/simple-filters.interface';

export interface SimpleFeatureList {
    layerId: string; // the layerId from which the entities are extracted
    attributeOrder: AttributeOrder; // the order in which the attributes are shown in the list (see AttributeOrder)
    sortBy?: SortBy; // sort the entities by a given attribute (see SortBy)
    formatURL?: boolean; // format an URL to show a description (true) or the whole URL (false)
    formatEmail?: boolean; // format an URL to show a description (true) or the who email address (false)
    paginator?: Paginator; // paginator (see Paginator)
  }

  export interface AttributeOrder {
    type: string; // name of the type in the data source
    personalizedFormatting?: string; // string used to merge multiple types
    description?: string; // description to put in front of the value of the attribute
    header?: string; // HTML header to use (ex. "h2")
  }

  export interface SortBy {
    defaultType: string; // the default type used for the sort
    sortOptions: SimpleFilter[]; //the options of types that will be available to sort the entities
  }

  export interface Paginator {
    pageSizeOptions?: number[] //the selectable options for the number of entries per page
    pageSize?: number; // the number of entities per page - the page size will be overridden if it is not an element of pageSizeOptions
    showFirstLastPageButtons?: boolean; // show the "Go to First Page" and "Go to Last Page" buttons
    showPreviousNextPageButtons?: boolean; // show the "Go to Previous Page" and "Go to Next Page" buttons
  }
