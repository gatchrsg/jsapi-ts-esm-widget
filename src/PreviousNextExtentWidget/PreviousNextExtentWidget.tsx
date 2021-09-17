import { subclass, property } from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { whenTrue, whenTrueOnce } from "@arcgis/core/core/watchUtils";
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
    // console.log("widget = ", this);
    whenTrueOnce(this, "renderedOnce", () => {
      this._attachHandleStationary();
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

  @property()
  poppedExtent: any = {
    xmin: undefined,
    xmax: undefined,
    ymin: undefined,
    ymax: undefined
  }

  @property()
  lastExtent: any = {
    xmin: undefined,
    xmax: undefined,
    ymin: undefined,
    ymax: undefined
  }

  @property()
  previousButtonClicked: boolean = false;

  //-------------------------------------------------------------------
  //  Public methods
  //-------------------------------------------------------------------

  render() {
    this.renderedOnce = true;
    let activeClasses = "esri-widget--button esri-interactive";
    let disabledClasses = activeClasses + " esri-disabled";

    return (
      <div class={this.classes(CSS.base)}>
        <button id="previousExtent" class={this.extentQueue.length > 1 ? activeClasses : disabledClasses}
        title="Previous extent"><span class="esri-icon-left-arrow"></span></button>
        <button id="nextExtent" class={this.nextQueue.length > 0 ? activeClasses : disabledClasses}
          title="Next extent"><span class="esri-icon-right-arrow"></span></button>
      </div>
    );
  }

  gotoPreviousExtent() {
    if (this.extentQueue.length > 1) {
      // popped var is going to be the extent that is
      // pushed to the nextQueue, and also the one used to
      // compare new extent with to decide whether to dump the
      // current nextQueue items if the user pans/zooms during
      // the course of navigation using the prev/next buttons
      let popped = this.extentQueue.pop();
      let beforeExtent = this.extentQueue[this.extentQueue.length - 1];
      if (popped) {
        this.poppedExtent = {
          xmin: popped.xmin,
          xmax: popped.xmax,
          ymin: popped.ymin,
          ymax: popped.ymax
        }
      }
      if (beforeExtent) {
        this.lastExtent = {
          xmin: beforeExtent.xmin,
          xmax: beforeExtent.xmax,
          ymin: beforeExtent.ymin,
          ymax: beforeExtent.ymax
        }
      }

      this.nextQueue.push(popped);
      this.view.goTo(this.extentQueue[this.extentQueue.length - 1]).then( () => {
        // manage the extentQueue, the stationary handler will fire after the goTo
        if (this.extentQueue.length > 0) {
          this.extentQueue.pop();
        }
      });
    }
  }

  gotoNextExtent() {
    if (this.nextQueue.length > 0) {
      let popped = this.nextQueue.pop();
      this.view.goTo(popped);
    }
  }

  //-------------------------------------------------------------------
  //  Private methods
  //-------------------------------------------------------------------

  private _stationaryHandler(mapView: MapView) {

    this._compareExtentToPopped();
    this.extentQueue.push(mapView.extent.clone());;
    // this._debugQueues()
  }

  private _attachHandleStationary() {
    whenTrue(this.view, "stationary", () => {
      this._stationaryHandler(this.view);
    });
  }

  private _compareExtentToPopped() {
    if (this.nextQueue.length > 0 && this.poppedExtent.xmin && this.lastExtent.xmin) {
      // if the extent is the next or the last it must be a new one, remove all
      // items from nextQueue
      if (( this.view.extent.xmin !== this.poppedExtent.xmin &&
            this.view.extent.ymin !== this.poppedExtent.ymin &&
            this.view.extent.xmax !== this.poppedExtent.xmax &&
            this.view.extent.ymax !== this.poppedExtent.ymax )
            && (
            this.view.extent.xmin !== this.lastExtent.xmin &&
            this.view.extent.ymin !== this.lastExtent.ymin &&
            this.view.extent.xmax !== this.lastExtent.xmax &&
            this.view.extent.ymax !== this.lastExtent.ymax )
            ) {
        this.nextQueue = [];
      }
    }
  }

  private _addClickListeners() {
    let previousExtent = document.getElementById("previousExtent");
    let nextExtent = document.getElementById("nextExtent");
    if (previousExtent) {
      previousExtent.addEventListener("click", () => {
        this.gotoPreviousExtent();
      });
    }

    if (nextExtent) {
      nextExtent.addEventListener("click", () => {
        this.gotoNextExtent();
      });
    }
  }
}

export default PreviousNextExtentWidget;
