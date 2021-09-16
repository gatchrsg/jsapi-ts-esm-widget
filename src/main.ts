import './style.css'
import MapView from '@arcgis/core/views/MapView';
import Map from "@arcgis/core/Map";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Extent from "@arcgis/core/geometry/Extent";
import PreviousNextExtentWidget from './PreviousNextExtentWidget/PreviousNextExtentWidget';

const map = new Map({
  basemap: 'dark-gray-vector'
});

const initialExtent = new Extent({
  xmax: -13004943.9076154,
  xmin: -13887262.57174876,
  ymax: 6280051.69664734,
  ymin: 5700907.786141661,
  spatialReference: new SpatialReference({wkid: 102100})
});

const view = new MapView({
  container: "viewDiv",
  map: map,
  extent: initialExtent,
});

const prevNext = new PreviousNextExtentWidget({
  view: view
});

view.when(() => {
  console.log(view);

  view.ui.add(prevNext, "top-right");
});