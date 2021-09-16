import { subclass, property } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { once, watch, when, whenOnce, whenTrue, whenTrueOnce } from "@arcgis/core/core/watchUtils";
import { tsx } from "@arcgis/core/widgets/support/widget";

import MapView from "@arcgis/core/views/MapView";
import Extent from "@arcgis/core/geometry/Extent";

const CSS = {
  base: "previous-next-extent-widget",
};

interface PreviousNextExtentWidgetParams extends __esri.WidgetProperties {
  view: MapView;
}

@subclass("app.widgets.PreviousNextExtentWidget")
class PreviousNextExtentWidget extends Widget {
  constructor(params?: PreviousNextExtentWidgetParams) {
    super(params);
  }

  postInitialize() {
    console.log("postInitialize PreviousNextExtentWidget");
    whenTrueOnce(this, "renderedOnce", () => {
      console.log("in whenTrueOnce");
      this._attachHandleStationary();
      this._attachHandleNavigating();
      this._attachHandleZoom();
      this._addClickListeners();
    });
  }

  //--------------------------------------------------------------------
  //  Properties
  //--------------------------------------------------------------------

  //----------------------------------
  //  view
  //----------------------------------

  @property()
  view!: MapView;

  @property()
  extentQueue: Array<Extent | undefined> = [];

  @property()
  nextQueue: Array<Extent | undefined> = [];

  @property()
  renderedOnce: boolean = false;

  //-------------------------------------------------------------------
  //  Public methods
  //-------------------------------------------------------------------

  render() {
    console.log("rendered");
    this.renderedOnce = true;
    return (
      <div class={this.classes(CSS.base)}>
        <button id="previousExtent" class="esri-widget--button esri-interactive esri-icon-left-arrow"
        title="Previous extent"></button>
        <button id="nextExtent" class="esri-widget--button esri-interactive esri-icon-right-arrow"
          title="Next extent"></button>
      </div>
    );
  }

  gotoPreviousExtent() {
    console.log("gotoPreviousExtent");
    if (this.extentQueue.length > 1) {
      this.nextQueue.push(this.extentQueue.pop());
      this.view.goTo(this.extentQueue[this.extentQueue.length - 1]).then( () => {
        if (this.extentQueue.length > 0) {
          this.extentQueue.pop();
        }
      });
    }
  }

  gotoNextExtent() {
    console.log("gotoNextExtent");
    if (this.nextQueue.length > 0) {
      let popped = this.nextQueue.pop();
      this.view.goTo(popped);
    }
  }

  //-------------------------------------------------------------------
  //  Private methods
  //-------------------------------------------------------------------

  private _stationaryHandler(mapView: MapView) {
    console.log("_stationaryHandler", mapView);
    this.extentQueue.push(mapView.extent.clone());
    console.log("extentQueue: ", this.extentQueue.length);
    console.log("nextQueue: ", this.nextQueue.length);
  }

  private _attachHandleStationary(callback?: Function ) {
    whenTrue(this.view, "stationary", () => {
      console.log("stationary true");
      this._stationaryHandler(this.view);
    });
    if (callback) {
      callback();
    }
  }

  private _navigatingHandler(mapView: MapView) {
    console.log("_navigatingHandler");
    this._zoomOrNavigateControlNextQueue();
  }

  private _attachHandleNavigating(callback?: Function) {
    whenTrue(this.view, "navigating", () => {
      this._navigatingHandler(this.view);
    });
    if (callback) {
      callback();
    }
  }

  private _zoomHandler(mapView: MapView) {
    console.log("__centerHandler ");
    this._zoomOrNavigateControlNextQueue()
  }

  private _attachHandleZoom(callback?: Function) {
    once(this.view, "zoom", () => {
      when(this.view, "stationary", () => {
        console.log(this.view.zoom);
        this._zoomHandler(this.view);
        if (callback) {
          callback();
        }
      });
    });
  }

  private _zoomOrNavigateControlNextQueue() {
    console.log("_zoomOrNavigateControlNextQueue");
    if (this.extentQueue.length > 1 && this.nextQueue.length > 0) {
      console.log("******* hit **********");
      this.nextQueue = [];
      console.log("nextQueue length: ", this.nextQueue.length);
    }
  }

  private _addClickListeners() {
    console.log("_addClickListeners");
    let previousExtent = document.getElementById("previousExtent");
    let nextExtent = document.getElementById("nextExtent");
    if (previousExtent) {
      console.log("previous extent listner added.")
      previousExtent.addEventListener("click", () => {
        this.gotoPreviousExtent();
      });
    } else {
      console.log ("previousExtent must be undefined: ", previousExtent);
    }

    if (nextExtent) {
      nextExtent.addEventListener("click", () => {
        console.log("next extent listner added.")
        this.gotoNextExtent();
      });
    }
  }
}

export default PreviousNextExtentWidget;
