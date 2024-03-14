import {
  FEATURE,
  Feature,
  FeatureMotion,
  IgoMap,
  SearchResult,
  getCommonVectorSelectedStyle
} from '@igo2/geo';
import { SearchState } from '@igo2/integration';

import olFeature from 'ol/Feature';
import type { default as OlGeometry } from 'ol/geom/Geometry';

export function onResultSelectOrFocus(
  result: SearchResult,
  map: IgoMap,
  searchState: SearchState,
  options?: { featureMotion?: FeatureMotion }
) {
  if (result.meta.dataType === FEATURE && result.data.geometry) {
    result.data.meta.style = getCommonVectorSelectedStyle(
      Object.assign(
        {},
        { feature: result.data as Feature | olFeature<OlGeometry> },
        searchState.searchOverlayStyleFocus,
        result.style?.focus ? result.style.focus : {}
      )
    );

    const feature = map.searchResultsOverlay.dataSource.ol.getFeatureById(
      result.meta.id
    );
    if (feature) {
      feature.setStyle(result.data.meta.style);
      return;
    }
    map.searchResultsOverlay.addFeature(
      result.data as Feature,
      options?.featureMotion
    );
  }
}

export function onResultUnfocus(
  result: SearchResult,
  map: IgoMap,
  searchState: SearchState
) {
  if (result.meta.dataType !== FEATURE) {
    return;
  }

  if (searchState.store.state.get(result).selected) {
    const feature = map.searchResultsOverlay.dataSource.ol.getFeatureById(
      result.meta.id
    );
    if (feature) {
      const style = getCommonVectorSelectedStyle(
        Object.assign(
          {},
          { feature: result.data as Feature | olFeature<OlGeometry> },
          searchState.searchOverlayStyleFocus,
          result.style?.focus ? result.style.focus : {}
        )
      );
      feature.setStyle(style);
    }
    return;
  }
  map.searchResultsOverlay.removeFeature(result.data as Feature);
}
