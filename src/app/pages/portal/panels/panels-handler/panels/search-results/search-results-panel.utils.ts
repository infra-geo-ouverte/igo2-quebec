import {
  CommonVectorStyleOptions,
  FEATURE,
  Feature,
  FeatureMotion,
  IgoMap,
  SearchResult,
  getCommonVectorSelectedStyle
} from '@igo2/geo';
import { SearchState } from '@igo2/integration';

export function onResultFocus(
  result: SearchResult,
  map: IgoMap,
  searchState: SearchState,
  options?: { featureMotion?: FeatureMotion }
) {
  onResultSelectOrFocus(result, map, searchState, 'focus', options);
}

export function onResultSelect(
  result: SearchResult,
  map: IgoMap,
  searchState: SearchState,
  options?: { featureMotion?: FeatureMotion }
) {
  onResultSelectOrFocus(result, map, searchState, 'select', options);
}

function onResultSelectOrFocus(
  result: SearchResult,
  map: IgoMap,
  searchState: SearchState,
  type: 'select' | 'focus',
  options?: { featureMotion?: FeatureMotion }
) {
  if (result.meta.dataType !== FEATURE) {
    return undefined;
  }
  const feature = (result as SearchResult<Feature>).data;

  // Somethimes features have no geometry. It happens with some GetFeatureInfo
  if (!feature.geometry) {
    return;
  }

  let searchOverlayStyle: CommonVectorStyleOptions =
    searchState.searchOverlayStyle;
  let resultStyle: CommonVectorStyleOptions = result.style?.base
    ? result.style.base
    : {};
  switch (type) {
    case 'focus':
      searchOverlayStyle = searchState.searchOverlayStyleFocus;
      resultStyle = result.style?.focus ? result.style.focus : {};
      break;
    case 'select':
      searchOverlayStyle = searchState.searchOverlayStyleSelection;
      resultStyle = result.style?.selection ? result.style.selection : {};
      break;
  }

  feature.meta.style = getCommonVectorSelectedStyle(
    Object.assign({}, { feature }, searchOverlayStyle, resultStyle)
  );

  map.searchResultsOverlay.addFeature(feature, options?.featureMotion);
}

export function onResultUnfocus(result: SearchResult, map: IgoMap) {
  const feature = map.searchResultsOverlay.dataSource.ol.getFeatureById(
    result.meta.id
  );
  if (feature) {
    map.searchResultsOverlay.removeFeature(result.data as Feature);
  }
}
