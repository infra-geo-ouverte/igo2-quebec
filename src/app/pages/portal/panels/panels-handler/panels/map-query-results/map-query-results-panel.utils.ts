import {
  FEATURE,
  Feature,
  FeatureMotion,
  IgoMap,
  SearchResult,
  getCommonVectorSelectedStyle
} from '@igo2/geo';
import { QueryState } from '@igo2/integration';

import olFeature from 'ol/Feature';
import type { default as OlGeometry } from 'ol/geom/Geometry';

export function onResultSelect(
  result: SearchResult,
  map: IgoMap,
  queryState: QueryState
) {
  if (result.meta.dataType === FEATURE && result.data.geometry) {
    result.data.meta.style = getCommonVectorSelectedStyle(
      Object.assign(
        {},
        { feature: result.data as Feature | olFeature<OlGeometry> },
        queryState.queryOverlayStyleSelection,
        result.style?.selection ? result.style.selection : {}
      )
    );

    const feature = map.searchResultsOverlay.dataSource.ol.getFeatureById(
      result.meta.id
    );
    if (feature) {
      feature.setStyle(result.data.meta.style);
      return;
    }
    map.queryResultsOverlay.addFeature(
      result.data as Feature,
      FeatureMotion.None
    );
  }
}
