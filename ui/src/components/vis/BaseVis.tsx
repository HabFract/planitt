import { select } from "d3-selection";
import { zoom } from "d3-zoom";
import { linkVertical, linkHorizontal } from "d3-shape";
import { HierarchyNode, tree } from "d3-hierarchy";
import { easeCubic, easeLinear } from "d3-ease";
import { TreeLayout } from "d3-hierarchy";
import _ from "lodash";

import {
  ONE_CHILD,
  ONE_CHILD_XS,
  TWO_CHILDREN_LEFT,
  TWO_CHILDREN_RIGHT,
  THREE_CHILDREN_LEFT,
  THREE_CHILDREN_RIGHT,
  FOUR_CHILDREN_LEFT_1,
  FOUR_CHILDREN_LEFT_2,
  FOUR_CHILDREN_RIGHT_1,
  FOUR_CHILDREN_RIGHT_2,
  FIVE_CHILDREN_LEFT_1,
  FIVE_CHILDREN_LEFT_2,
  FIVE_CHILDREN_RIGHT_1,
  FIVE_CHILDREN_RIGHT_2,
  SIX_CHILDREN_LEFT_1,
  SIX_CHILDREN_LEFT_2,
  SIX_CHILDREN_LEFT_3,
  SIX_CHILDREN_RIGHT_1,
  SIX_CHILDREN_RIGHT_2,
  SIX_CHILDREN_RIGHT_3,

  TWO_CHILDREN_RIGHT_XS,
  TWO_CHILDREN_LEFT_XS,
  THREE_CHILDREN_LEFT_XS,
  THREE_CHILDREN_RIGHT_XS,
  FOUR_CHILDREN_LEFT_1_XS,
  FOUR_CHILDREN_LEFT_2_XS,
  FOUR_CHILDREN_RIGHT_1_XS,
  FOUR_CHILDREN_RIGHT_2_XS,
  FIVE_CHILDREN_LEFT_1_XS,
  FIVE_CHILDREN_LEFT_2_XS,
  FIVE_CHILDREN_RIGHT_1_XS,
  FIVE_CHILDREN_RIGHT_2_XS,
  SIX_CHILDREN_LEFT_1_XS,
  SIX_CHILDREN_LEFT_2_XS,
  SIX_CHILDREN_LEFT_3_XS,
  SIX_CHILDREN_RIGHT_1_XS,
  SIX_CHILDREN_RIGHT_2_XS,
  SIX_CHILDREN_RIGHT_3_XS
} from './PathTemplates/paths';

import { expand, collapse, contentEqual, nodeStatusColours, parseTreeValues, cumulativeValue, outOfBoundsNode, getInitialXTranslate, getInitialYTranslate, newXTranslate, newYTranslate, debounce } from "./helpers";

import { noNodeCol, parentPositiveBorderCol, positiveColLighter, BASE_SCALE, FOCUS_MODE_SCALE, LG_LEVELS_HIGH, LG_LEVELS_WIDE, LG_NODE_RADIUS, XS_LEVELS_HIGH, XS_LEVELS_WIDE, XS_NODE_RADIUS } from "./constants";
import { EventHandlers, IVisualization, Margins, ViewConfig, VisType, ZoomConfig } from "./types";
import { ActionHashB64, EntryHashB64 } from "@holochain/client";
import { GetOrbitsDocument, Orbit } from "../../graphql/generated";
import { client } from "../../graphql/client";
import { OrbitNodeDetails, store, SphereOrbitNodes, mapToCacheObject, nodeCache } from "../../state/jotaiKeyValueStore";
import { extractEdges } from "../../graphql/utils";

/**
 * Base class for creating D3 hierarchical visualizations.
 * This class handles the setup and rendering of the visualization.
 * Extend this class to implement specific types of visualizations.
 */
export abstract class BaseVisualization implements IVisualization {
  type: VisType;
  _svgId: string;
  _canvas: any;
  zoomer: any;
  rootData: HierarchyNode<any>;
  nodeDetails: SphereOrbitNodes;
  sphereEh: EntryHashB64;
  sphereAh: ActionHashB64;
  globalStateTransition: Function;
  _nextRootData: HierarchyNode<any> | null;
  _viewConfig: ViewConfig;
  _zoomConfig: ZoomConfig;
  eventHandlers: EventHandlers;
  _hasRendered: boolean = false;
  isModalOpen: boolean = false;
  skipMainRender: boolean = false;
  isNewActiveNode: boolean = false;
  activeNode: any = null;


  /**
   * Constructor for the BaseVisualization class.
   * @param type - The type of visualization.
   * @param svgId - The ID of the SVG element.
   * @param inputTree - The input data for the tree.
   * @param canvasHeight - The height of the canvas.
   * @param canvasWidth - The width of the canvas.
   * @param margin - The margins for the canvas.
   * @param globalStateTransition - Function to handle global state transitions.
   * @param sphereEh - Entry hash for the sphere.
   * @param sphereAh - Action hash for the sphere.
   * @param nodeDetails - Details of the nodes in the sphere (from the cache).
   */
  constructor(
    type: VisType,
    svgId: string,
    inputTree: HierarchyNode<any>,
    canvasHeight: number,
    canvasWidth: number,
    margin: Margins,
    globalStateTransition: (newState: string, params: object) => void,
    sphereEh: EntryHashB64,
    sphereAh: ActionHashB64,
    nodeDetails: SphereOrbitNodes
  ) {
    this.type = type;
    this._svgId = svgId;
    this.rootData = inputTree;
    this.globalStateTransition = globalStateTransition;
    this.sphereEh = sphereEh;
    this.sphereAh = sphereAh;
    this.nodeDetails = nodeDetails;
    this._nextRootData = null;

    this._viewConfig = this.initializeViewConfig(canvasHeight, canvasWidth, margin);
    this._zoomConfig = this.initializeZoomConfig();
    this.eventHandlers = this.initializeEventHandlers();

    this.zoomer = this.initializeZoomer();
  }

  protected abstract initializeViewConfig(canvasHeight: number, canvasWidth: number, margin: Margins): ViewConfig;
  protected abstract initializeZoomConfig(): ZoomConfig;
  protected abstract initializeEventHandlers(): EventHandlers;
  protected abstract initializeZoomer(): any;

  /**
   * Set up the canvas for rendering.
   */
  protected setupCanvas(): void {
    if (this.noCanvas()) {
      this._canvas = select(`#${this._svgId}`)
        .append("g")
        .classed("canvas", true);
    }
  }

  /**
   * Set up the layout for the visualization.
   */
  protected abstract setupLayout(): void;

  /**
   * Set up node and link groups.
   */
  protected abstract setupNodeAndLinkGroups(): void;

  /**
   * Set up node and link enter selections.
   */
  protected abstract setupNodeAndLinkEnterSelections(): void;

  /**
   * Append circles and labels to the visualization.
   */
  protected abstract appendCirclesAndLabels(): void;

  /**
   * Render the visualization.
   */
  public render(): void {
    if (this.noCanvas()) {
      this.setupCanvas();
    }

    if (this.firstRender() || this.hasNextData()) {
      this.clearCanvas();

      if (this.hasNextData()) {
        this.rootData = this._nextRootData!;
        this._nextRootData = null;
      }

      this.setupLayout();
      this.setupNodeAndLinkGroups();
      this.setupNodeAndLinkEnterSelections();
      this.appendCirclesAndLabels();

      this.applyInitialTransform();

      this._hasRendered = true;
    }
  }

  // Utility methods:
  /**
     * Checks if the canvas element exists in the DOM.
     * @returns {boolean} True if the canvas doesn't exist or is empty, false otherwise.
     */
  protected noCanvas(): boolean {
    return (
      typeof this._canvas === "undefined" ||
      (select(`#${this._svgId} .canvas`) as any)._groups.length === 0
    );
  }

  /**
   * Determines if this is the first render of the visualization.
   * @returns {boolean} True if this is the first render, false otherwise.
   */
  protected firstRender(): boolean {
    return !this._hasRendered;
  }

  /**
   * Checks if there is new data to be rendered.
   * @returns {boolean} True if there is new data (_nextRootData is not null), false otherwise.
   */
  protected hasNextData(): boolean {
    return this._nextRootData !== null;
  }

  /**
   * Clears all child elements from the canvas.
   * This is typically called before re-rendering the visualization with new data.
   */
  protected clearCanvas(): void {
    select(".canvas").selectAll("*").remove();
  }

  /**
   * Applies the initial transform to the visualization.
   * This method should be implemented by subclasses to set up the initial view of the visualization.
   */
  protected abstract applyInitialTransform(): void;

}

// export default class BaseVisualization implements IVisualization {
//   type: VisType;
//   _svgId: string;
//   _canvas: any;
//   _manager: any;
//   zoomer: any;
//   rootData: any;
//   nodeDetails: SphereOrbitNodes;
//   sphereEh: EntryHashB64;
//   sphereAh: ActionHashB64;
//   globalStateTransition: Function;
//   modalIsOpen?: boolean;
//   modalParentOrbitEh?: Function;
//   modalChildOrbitEh?: Function;
//   _nextRootData: any;
//   layout!: TreeLayout<unknown>;
//   _viewConfig: ViewConfig;
//   _zoomConfig: ZoomConfig;
//   eventHandlers: EventHandlers;
//   _hasRendered: boolean = false;
//   skipMainRender: boolean = false;
//   isNewActiveNode?: boolean;
//   activeNode: any;
//   _enteringNodes: any;
//   isCollapsed: boolean = false;
//   isExpanded: boolean = false;

//   currentEventTimestamp!: number;

//   _gLink: any;
//   _gNode: any;
//   _gCircle: any;
//   gCirclePulse: any;
//   _gTooltip: any;
//   _gButton: any;
//   _enteringLinks: any;

//   /**
//    * Constructor for the BaseVisualization class.
//    * @param type - The type of visualization.
//    * @param svgId - The ID of the SVG element.
//    * @param inputTree - The input data for the tree.
//    * @param canvasHeight - The height of the canvas.
//    * @param canvasWidth - The width of the canvas.
//    * @param margin - The margins for the canvas.
//    * @param globalStateTransition - Function to handle global state transitions.
//    * @param sphereEh - Entry hash for the sphere.
//    * @param sphereAh - Action hash for the sphere.
//    * @param nodeDetails - Details of the nodes in the sphere (from the cache).
//    */
//   constructor(type: VisType, svgId: string, inputTree: HierarchyNode<string>, canvasHeight: number, canvasWidth: number, margin: Margins, globalStateTransition: (newState: string, params: object) => void, sphereEh: EntryHashB64, sphereAh: ActionHashB64, nodeDetails: SphereOrbitNodes) {
//     this.type = type;
//     this._svgId = svgId;
//     this.rootData = inputTree;
//     this.globalStateTransition = globalStateTransition;
//     this.sphereEh = sphereEh;
//     this.sphereAh = sphereAh;
//     this.nodeDetails = nodeDetails;
//     this.modalIsOpen = false;

//     this._viewConfig = {
//       scale: type == VisType.Radial ? BASE_SCALE / 2 : BASE_SCALE,
//       clickScale: FOCUS_MODE_SCALE,
//       margin: margin,
//       canvasHeight,
//       canvasWidth,
//       defaultView: 'Tree',

//       defaultCanvasTranslateX: () => {
//         const initialX = getInitialXTranslate.call(this,
//           { defaultView: this._viewConfig.defaultView, levelsWide: this._viewConfig.levelsWide });
//         return typeof this._zoomConfig.previousRenderZoom?.node?.x !==
//           "undefined"
//           ? initialX + this._viewConfig.margin.left +
//           (newXTranslate(this.type, this._viewConfig, this._zoomConfig) as number)
//           : initialX + this._viewConfig.margin.left;
//       },
//       defaultCanvasTranslateY: () => {
//         const initialY = getInitialYTranslate.call(
//           this,
//           this.type,
//           { defaultView: this._viewConfig.defaultView, levelsHigh: this._viewConfig.levelsHigh },
//         );
//         return typeof this._zoomConfig.previousRenderZoom?.node?.y !==
//           "undefined"
//           ? (this._viewConfig.margin.top as number) +
//           initialY +
//           newYTranslate(
//             this.type,
//             this._viewConfig,
//             this._zoomConfig
//           ) as number
//           : initialY + this._viewConfig.margin.top;
//       },
//       isSmallScreen: function () {
//         return this.canvasWidth < 1025;
//       },
//     };

//     this._zoomConfig = {
//       focusMode: false,
//       previousRenderZoom: {},
//       zoomedInView: function () {
//         return Object.keys(this.previousRenderZoom).length !== 0;
//       },
//     };

//     this.eventHandlers = {
//       handlePrependNode: function ({ childOrbitEh }) {
//         this.modalOpen(true);
//         this.modalIsOpen = true;
//         this.modalChildOrbitEh(childOrbitEh)
//       },
//       handleAppendNode: function ({ parentOrbitEh }) {
//         this.modalOpen(true);
//         this.modalIsOpen = true;
//         this.modalParentOrbitEh(parentOrbitEh)
//       },
//       handleDeleteNode: function (_, node) {
//         // this.setCurrentHabit(node);
//         // this.setCurrentNode(node);
//         // store.dispatch(toggleConfirm({ type: "Delete" }));
//         // this.render();
//       },
//       rgtClickOrDoubleTap: function (e, d) {
//         // this.eventHandlers.handleNodeFocus.call(this, e, d);
//         // this.handleStatusChange.call(this, d);
//         // this.type != "radial" &&
//         //   this.eventHandlers.handleNodeZoom.call(this, e, d, false);
//       }.bind(this),
//       handleNodeZoom: function (event, node, forParent = false) {
//         // if (!node) return;
//         // this._zoomConfig.globalZoomScale = this._viewConfig.clickScale;
//         // this._zoomConfig.focusMode = true;

//         // if (event) {
//         //   this.setActiveNode(node.data, event);
//         // }
//         // const parentNode = { ...node.parent };

//         // if (!this._gLink.attr("transform")) {
//         //   // Set for cross render transformation memory
//         //   this._zoomConfig.previousRenderZoom = {
//         //     event: event,
//         //     node: forParent ? parentNode : node,
//         //     scale: this._zoomConfig.globalZoomScale,
//         //   };
//         // }
//         // select(".canvas")
//         //   .transition()
//         //   .ease(easePolyIn.exponent(8))
//         //   .delay(!!event || !this.isNewActiveNode ? 0 : 100)
//         //   .duration(!!event || !this.isNewActiveNode ? 1 : 2000)
//         //   .attr(
//         //     "transform",
//         //     `translate(${this._viewConfig.defaultCanvasTranslateX(
//         //       this._zoomConfig.globalZoomScale
//         //     )},${this._viewConfig.defaultCanvasTranslateY(
//         //       this._zoomConfig.globalZoomScale
//         //     )}), scale(${this._zoomConfig.globalZoomScale})`
//         //   );
//       },
//       handleNodeFocus: function (event, node) {
//         // event.preventDefault();
//         // this.calibrateViewBox();
//         // const currentHabit = selectCurrentHabit(store.getState());

//         // const targ = event?.target;
//         // if (targ.tagName == "circle") {
//         //   if (
//         //     !!node?.data?.name &&
//         //     !(node.data.name == currentHabit?.meta.name)
//         //   ) {
//         //     this.setCurrentHabit(node);
//         //     this.setCurrentNode(node);
//         //   }
//         //   if (currentHabit?.meta?.name !== node?.data?.name)
//         //     this.setActiveNode(node.data, event);

//         //   // if (this.type == VisType.Tree) {
//         //   //   const nodesToCollapse = nodesForCollapse
//         //   //     .call(this, node, {
//         //   //       cousinCollapse: true,
//         //   //       auntCollapse: true,
//         //   //     })
//         //   //     .map((n) => n?.data?.content);
//         //   //   this.rootData.each((node) => {
//         //   //     if (nodesToCollapse.includes(node.data.content)) collapse(node);
//         //   //   });
//         //   //   expand(node?.parent ? node.parent : node);
//         //   //   this.render();
//         //   // }
//         // }
//       },
//       handleMouseEnter: function ({ target: d }) {
//         this.currentTooltip = select(d).selectAll("g.tooltip");

//         this.currentTooltip.transition().duration(450).style("opacity", "1");
//         this.currentButton = select(d).selectAll("g.habit-label-dash-button");
//         this.currentButton
//           .transition()
//           .delay(100)
//           .duration(450)
//           .style("opacity", "1");
//       },


//     };


//   }

//   zoomBase() {
//     return select(`#${this._svgId}`);
//   }

//   firstRender(): boolean {
//     return !this._hasRendered;
//   }

//   noCanvas(): boolean {
//     return (
//       typeof this?._canvas == "undefined" ||
//       (select(`#${this._svgId} .canvas`) as any)._groups.length == 0
//     );
//   }

//   hasNextData(): boolean {
//     return !!this?._nextRootData;
//   }

//   hasSummedData(): boolean {
//     return !!this.rootData?.value;
//   }

//   hasNewHierarchyData(): boolean {
//     return (
//       this.hasNextData()// && hierarchyStateHasChanged(this._nextRootData, this)
//     );
//   }

//   setActiveNode(clickedNodeContent, event: any = null) {
//     this?.isNewActiveNode && delete this.isNewActiveNode;

//     this.activeNode = this.findNodeByContent(clickedNodeContent);

//     const currentActiveG = document.querySelector(".the-node.active");
//     if (currentActiveG) currentActiveG.classList.toggle("active");
//     event && event.target?.closest(".the-node")?.classList?.toggle("active");

//     // this.render();
//     // this.activateNodeAnimation();
//     return this.activeNode;
//   }

//   findNodeByContent(node) {
//     if (node === undefined || node.content === undefined) return;
//     let found;
//     this.rootData.each((n) => {
//       if (contentEqual(n.data, node)) {
//         found = n;
//       }
//     });
//     return found;
//   }

//   setCurrentNode(node): void {
//     const nodeContent = node?.data
//       ? parseTreeValues(node?.data.content)
//       : parseTreeValues(node.content);
//     // let newCurrent = selectCurrentNodeByMptt(
//     //   store.getState(),
//     //   nodeContent.left,
//     //   nodeContent.right
//     // );
//     // if (!newCurrent) {
//     //   console.error("Couldn't select node");
//     //   return;
//     // }
//     // store.dispatch(updateCurrentNode(newCurrent));
//   }

//   setCurrentHabit(node): void {
//     let newCurrent;
//     try {
//       const nodeContent = node?.data
//         ? parseTreeValues(node?.data.content)
//         : parseTreeValues(node.content);
//       // newCurrent = selectCurrentHabitByMptt(
//       //   store.getState(),
//       //   nodeContent.left,
//       //   nodeContent.right
//       // );
//     } catch (err) {
//       console.error("Couldn't select habit: " + err);
//       return;
//     }
//     // store.dispatch(updateCurrentHabit(newCurrent));
//     // const s = store.getState();
//     // if (selectCurrentHabit(s)?.meta.id !== selectCurrentHabitDate(s)?.habitId) {
//     //   store.dispatch(
//     //     fetchHabitDatesREST({
//     //       id: newCurrent?.meta.id,
//     //       periodLength: 7,
//     //     })
//     //   );
//     // }
//   }

//   updateRootDataAfterAccumulation(newRootData) {
//     // const currentDate = selectCurrentDateId(store.getState());

//     // const { updateCurrentHierarchy, updateCachedHierarchyForDate } =
//     //   hierarchySlice.actions;
//     // store.dispatch(
//     //   updateCachedHierarchyForDate({
//     //     dateId: currentDate,
//     //     newHierarchy: newRootData,
//     //   })
//     // );
//     // store.dispatch(updateCurrentHierarchy({ nextDateId: currentDate }));
//     // this._nextRootData = newRootData;
//     // delete this._nextRootData.newHabitDatesAdded;
//   }

//   addHabitDatesForNewNodes(
//     startingNode = this.rootData,
//     completedValue = false
//   ) {
//     // // If we are adding a false completed value (temp habit dates that will only be persisted if updated to true)
//     // let newRootData = hierarchy({ ...this.rootData.data });
//     // accumulateTree(newRootData, this);
//     // if (startingNode.data.name == this.rootData.data.name) {
//     //   // Option 1: Traverse the tree and create many
//     //   newRootData.each((d) => {
//     //     if (
//     //       nodeWithoutHabitDate(d?.data, store) &&
//     //       isALeaf(d) &&
//     //       !d?.data.content.match(/OOB/)
//     //     ) {
//     //       this.createNewHabitDateForNode(d, completedValue);
//     //       this.mutateTreeJsonForNewHabitDates(d);
//     //     }
//     //   });
//     // } else {
//     //   // Option 2: Create a new true habit date for a 'cascaded' ancestor node
//     //   this.createNewHabitDateForNode(startingNode, JSON.parse(completedValue));
//     // }
//     // this.updateRootDataAfterAccumulation(newRootData);
//     // this.rootData.newHabitDatesAdded = true;
//   }

//   mutateTreeJsonForNewHabitDates(d) {
//     // Toggle in memory
//     d.data.content = d.data.content.replace(/\-$/, "-false");
//   }

//   createNewHabitDateForNode(node, withStatus = false) {
//     // const nodeContent = node?.data
//     //   ? parseTreeValues(node?.data.content)
//     //   : parseTreeValues(node.content);

//     // const currentDate = selectCurrentDateId(store.getState());
//     // const currentHabit = selectCurrentHabitByMptt(
//     //   store.getState(),
//     //   nodeContent.left,
//     //   nodeContent.right
//     // );
//     // if (!currentHabit) {
//     //   console.log("Couldn't select habit when adding habit dates");
//     //   return;
//     // }
//     // // Create a habit date ready for persisting
//     // store.dispatch(
//     //   createHabitDate({
//     //     habitId: currentHabit?.meta.id,
//     //     dateId: currentDate,
//     //     completed: withStatus,
//     //   })
//     // );
//   }

//   handleStatusChange(node) {
//     // const nodeHasOOBAncestors =
//     //   node.descendants().findIndex((n) => {
//     //     return n.data.content.match(/OOB/);
//     //   }) !== -1;

//     // if (!isALeaf(node) && !nodeHasOOBAncestors) {
//     //   return;
//     // } else {
//     //   const currentHabit = selectCurrentHabit(store.getState());
//     //   const currentDate = selectCurrentDateId(store.getState());
//     //   const currentDateFromDate = selectCurrentDate(store.getState())?.timeframe
//     //     .fromDate;

//     //   const nodeContent = parseTreeValues(node.data.content);
//     //   const currentStatus = nodeContent!.status;

//     //   const theNode = this.zoomBase()
//     //     .selectAll(".the-node circle")
//     //     .filter((n) => {
//     //       if (!!n?.data?.name && n?.data?.name === node.data.name) return n;
//     //     });
//     //   if (node.data.name.includes("Sub-Habit")) return;
//     //   // If this was not a ternarising/placeholder sub habit that we created just for more even distribution
//     //   const newStatus = oppositeStatus(currentStatus);
//     //   if (currentStatus == "true" && newStatus == "false") {
//     //     this.addHabitDatesForNewNodes(node, false);
//     //   } else {
//     //     store.dispatch(
//     //       updateHabitDateForNode({
//     //         habitId: currentHabit?.meta?.id,
//     //         dateId: currentDate,
//     //         completed: JSON.parse(newStatus),
//     //         fromDateForToday: currentDateFromDate,
//     //       })
//     //       // Also toggle 'cascaded' ancestor nodes
//     //     );
//     //   }
//     //   if (currentStatus) {
//     //     node.data.content = node.data.content.replace(/true|false/, newStatus);
//     //   } else {
//     //     node.data.content = node.data.content.replace(/\-$/, "-" + newStatus);
//     //   }
//     //   const newColor = getColor(JSON.parse(newStatus));
//     //   theNode.attr("fill", newColor);
//     //   theNode.attr("stroke", newColor);

//     //   const storedHabits = selectStoredHabits(store.getState());
//     //   let lastCascadedNode = false;
//     //   node?.ancestors()?.length &&
//     //     node.ancestors().forEach((a) => {
//     //       if (a?.data?.name == currentHabit?.meta?.name || lastCascadedNode)
//     //         return;
//     //       if (a?.children && a.children.length > 1) {
//     //         lastCascadedNode = true;
//     //         return;
//     //       }

//     //       const nodeCircle = this.zoomBase()
//     //         .selectAll(".the-node circle")
//     //         .filter((n) => {
//     //           if (!!n?.data?.name && n?.data?.name === a.data.name) return a;
//     //         });

//     //       nodeCircle.attr("fill", newColor);
//     //       nodeCircle.attr("stroke", newColor);

//     //       if (nodeWithoutHabitDate(a?.data, store)) {
//     //         this.addHabitDatesForNewNodes(a, true);
//     //         return;
//     //       }

//     //       if (parseTreeValues(a.data.content)?.status == "") {
//     //         const habitId =
//     //           storedHabits[
//     //             storedHabits.findIndex((h) => h.meta?.name == a.data.name)
//     //           ]?.meta?.id;

//     //         store.dispatch(
//     //           updateHabitDateForNode({
//     //             habitId: habitId,
//     //             dateId: currentDate,
//     //             completed: JSON.parse(newStatus),
//     //             fromDateForToday: currentDateFromDate,
//     //           })
//     //         );
//     //       }
//     //     });

//     //   accumulateTree(this.rootData, this);
//     //   this.updateRootDataAfterAccumulation(this.rootData);
//     //   this.newHabitDatesAdded = true;
//     // }
//   }

//   removeCanvas(): void {
//     select(".canvas")?.remove();
//   }

//   clearCanvas(): void {
//     select(".canvas").selectAll("*").remove();
//   }

//   // clearPreviousLinkPath() : void {
//   //   this._canvas.selectAll("g.links *").remove();
//   // }

//   appendLinkPath(): void {
//     const rootNodeId = this.rootData.data.content;
//     const cacheItem: OrbitNodeDetails = store.get(nodeCache.items)?.[this.sphereAh]?.[rootNodeId];
//     if (!cacheItem || !cacheItem?.path) return

//     const newPath = select(".canvas").selectAll("g.links").append('path')
//       .attr("d", cacheItem.path)
//       .classed("link", true)
//       .classed("appended-path", true)
//       .attr("stroke-width", "3")
//       .attr("stroke-opacity", "0.3")
//       .attr("data-testid", getTestId(cacheItem.path));

//     const pathElement = newPath._groups[0][0];
//     const { height, width } = pathElement.getBoundingClientRect();
//     select(pathElement).attr("transform", `translate(${getPathXTranslation(cacheItem.path, width, (this._viewConfig.isSmallScreen() ? 30 : 250) / this._viewConfig.scale) * this._viewConfig.scale},${-((height + (this._viewConfig.isSmallScreen() ? 0 : 100)) * this._viewConfig.scale)})`);

//     // Helper function to get exact x translation based on path
//     function getPathXTranslation(path: string, width: number, offset: number): number {
//       switch (path) {
//         case ONE_CHILD:
//           return 0
//         case ONE_CHILD_XS:
//           return 0
//         case TWO_CHILDREN_LEFT:
//           return width + offset
//         case TWO_CHILDREN_RIGHT:
//           return -(width + offset)
//         case TWO_CHILDREN_LEFT_XS:
//           return width + offset
//         case TWO_CHILDREN_RIGHT_XS:
//           return -(width + offset)
//         case THREE_CHILDREN_LEFT:
//           return width + offset * 2
//         case THREE_CHILDREN_RIGHT:
//           return -(width + offset * 2)
//         case THREE_CHILDREN_LEFT_XS:
//           return width + offset * 2
//         case THREE_CHILDREN_RIGHT_XS:
//           return -(width + offset * 2)
//         case FOUR_CHILDREN_LEFT_1:
//           return width + offset * 3
//         case FOUR_CHILDREN_LEFT_2:
//           return width + offset
//         case FOUR_CHILDREN_RIGHT_1:
//           return -(width + offset)
//         case FOUR_CHILDREN_RIGHT_2:
//           return -(width + offset * 3)
//         case FOUR_CHILDREN_LEFT_1_XS:
//           return width + offset * 3
//         case FOUR_CHILDREN_LEFT_2_XS:
//           return width + offset
//         case FOUR_CHILDREN_RIGHT_1_XS:
//           return -(width + offset)
//         case FOUR_CHILDREN_RIGHT_2_XS:
//           return -(width + offset * 3)
//         case FIVE_CHILDREN_LEFT_1:
//           return width + offset * 4
//         case FIVE_CHILDREN_LEFT_2:
//           return width + offset * 2
//         case FIVE_CHILDREN_RIGHT_1:
//           return -(width + offset * 2)
//         case FIVE_CHILDREN_RIGHT_2:
//           return -(width + offset * 4)
//         case FIVE_CHILDREN_LEFT_1_XS:
//           return width + offset * 4
//         case FIVE_CHILDREN_LEFT_2_XS:
//           return width + offset * 2
//         case FIVE_CHILDREN_RIGHT_1_XS:
//           return -(width + offset * 2)
//         case FIVE_CHILDREN_RIGHT_2_XS:
//           return -(width + offset * 4)
//         case SIX_CHILDREN_LEFT_1:
//           return width + offset * 5
//         case SIX_CHILDREN_LEFT_2:
//           return width + offset * 2
//         case SIX_CHILDREN_LEFT_3:
//           return width + offset * 2
//         case SIX_CHILDREN_RIGHT_1:
//           return -(width + offset * 2)
//         case SIX_CHILDREN_RIGHT_2:
//           return -(width + offset * 2)
//         case SIX_CHILDREN_RIGHT_3:
//           return -(width + offset * 5)
//         case SIX_CHILDREN_LEFT_1_XS:
//           return width + offset * 5
//         case SIX_CHILDREN_LEFT_2_XS:
//           return width + offset * 2
//         case SIX_CHILDREN_LEFT_3_XS:
//           return width + offset * 2
//         case SIX_CHILDREN_RIGHT_1_XS:
//           return -(width + offset * 2)
//         case SIX_CHILDREN_RIGHT_2_XS:
//           return -(width + offset * 2)
//         case SIX_CHILDREN_RIGHT_3_XS:
//           return -(width + offset * 5)
//         default:
//           return 0
//       }
//     }
//     // Helper function to fetch path testId based on path
//     function getTestId(path: string): string {
//       switch (path) {
//         case ONE_CHILD:
//           return 'path-parent-one-child'
//         case ONE_CHILD_XS:
//           return 'path-parent-one-child'
//         case TWO_CHILDREN_LEFT_XS:
//           return 'path-parent-two-children-0'
//         case TWO_CHILDREN_RIGHT_XS:
//           return 'path-parent-two-children-1'
//         case THREE_CHILDREN_LEFT_XS:
//           return 'path-parent-three-children-0'
//         case THREE_CHILDREN_RIGHT_XS:
//           return 'path-parent-three-children-2'
//         default:
//           return 'none'
//       }
//     }
//   }

//   resetForExpandedMenu({ justTranslation }) {
//     // let newTranslate = this._viewConfig.defaultView.split` `;
//     // if (this.type !== "radial") {
//     //   newTranslate[0] = -(this._viewConfig.previousRenderZoom
//     //     ? this._viewConfig.previousRenderZoom.x + this._viewConfig.margin.left
//     //     : 0);
//     //   newTranslate[1] = -(this._viewConfig.previousRenderZoom
//     //     ? this._viewConfig.previousRenderZoom.y -
//     //       this._viewConfig.defaultCanvasTranslateY() / 2
//     //     : 0);
//     // }
//     // let newTranslateString = newTranslate.join(" ");
//     // this.zoomBase()
//     //   .transition()
//     //   .duration(0)
//     //   .ease(easeLinear)
//     //   .attr("viewBox", newTranslateString);

//     // this._zoomConfig.previousRenderZoom = {};

//     // if (!justTranslation) {
//     //   this.expand();
//     //   this.activeNode.isNew = null;
//     //   this.activeNode = this.rootData;
//     //   document.querySelector(".the-node.active") &&
//     //     document.querySelector(".the-node.active").classList.remove("active");
//     // }
//   }

//   setLevelsHighAndWide(): void {
//     if (this._viewConfig.isSmallScreen()) {
//       this._viewConfig.levelsHigh = XS_LEVELS_HIGH;
//       this._viewConfig.levelsWide = XS_LEVELS_WIDE;
//     } else {
//       this._viewConfig.levelsHigh = LG_LEVELS_HIGH;
//       this._viewConfig.levelsWide = LG_LEVELS_WIDE;
//     }
//   }

//   setdXdY(): void {
//     this._viewConfig.dx =
//       this._viewConfig.canvasWidth / (this._viewConfig.levelsHigh as number * 2) - // Adjust for tree horizontal spacing on different screens
//       +(this.type == VisType.Tree && this._viewConfig.isSmallScreen()) * 250 -
//       +(this.type == VisType.Cluster && this._viewConfig.isSmallScreen()) * 210;
//     this._viewConfig.dy =
//       this._viewConfig.canvasHeight / (this._viewConfig.levelsWide as number * 4);
//     //adjust for taller aspect ratio
//     this._viewConfig.dx *= this._viewConfig.isSmallScreen() ? 4.25 : 2;
//     this._viewConfig.dy *= this._viewConfig.isSmallScreen() ? 3.25 : 2;
//   }

//   setNodeRadius(): void {
//     this._viewConfig.nodeRadius =
//       (this._viewConfig.isSmallScreen() ? XS_NODE_RADIUS : LG_NODE_RADIUS) * BASE_SCALE;
//   }

//   setZoomBehaviour(): void {
//     const zooms = function (e) {
//       let t = { ...e.transform };
//       let scale;
//       let x, y;
//       if (
//         false //e?.sourceEvent &&
//         // this.type == "radial" && // If it's the first zoom, just zoom in a little programatically, not out to scale 1
//         // ((Math.abs(t.k < 1.1) &&
//         //   e.sourceEvent?.deltaY < 0 &&
//         //   e.sourceEvent?.deltaY > -60) ||
//         //   (t.k == 1 && t.x < 150 && t.y < 150))
//       ) {
//         // Radial needs an initial zoom in
//         // t.k = this._viewConfig.clickScale;
//         // this.zoomBase().call(
//         //   this.zoomer.transform,
//         //   Object.assign(e.transform, t)
//         // );
//         // return;
//       }
//       if (this._zoomConfig.focusMode) {
//         this.resetForExpandedMenu({ justTranslation: true });
//         this._zoomConfig.focusMode = false;
//         return;
//       } else {
//         scale = t.k;
//         x = t.x + this._viewConfig.defaultCanvasTranslateX(scale) * scale;
//         y = t.y + this._viewConfig.defaultCanvasTranslateY(scale) * scale;
//       }
//       select(".canvas")
//         .transition()
//         .ease(easeLinear)
//         .duration(200)
//         .attr("transform", `translate(${x},${y}), scale(${scale})`);
//       this._zoomConfig.focusMode = false;
//     };

//     this.zoomer = zoom().scaleExtent([0.1, 1.5]).on("zoom", zooms.bind(this));
//     this.zoomBase().call(this.zoomer);
//   }

//   calibrateViewPortAttrs(): void {
//     this._viewConfig.viewportW =
//       this._viewConfig.canvasWidth * (this._viewConfig.levelsWide as number);
//     this._viewConfig.viewportH =
//       this._viewConfig.canvasHeight * (this._viewConfig.levelsHigh as number);

//     this._viewConfig.viewportX = 0;
//     this._viewConfig.viewportY = 0;

//     this._viewConfig.defaultView = `${this._viewConfig.viewportX} ${this._viewConfig.viewportY} ${this._viewConfig.viewportW} ${this._viewConfig.viewportH}`;
//   }

//   calibrateViewBox(): void {
//     this.zoomBase()
//       .attr("viewBox", this._viewConfig.defaultView)
//       .attr("preserveAspectRatio", "xMidYMid meet")
//       .on("dblclick.zoom", null);
//   }

//   // static sumHierarchyData(data): void {
//   //   if (!data?.sum) return;
//   //   data.sum((d) => {
//   //     // Return a binary interpretation of whether the habit was completed that day
//   //     // const thisNode = data.descendants().find((node) => node.data == d);
//   //     // let content = parseTreeValues(thisNode.data.content);

//   //     // if (content!.status === "") return 0;
//   //     // if (content!.status === "OOB") return 0;

//   //     // const statusValue = JSON.parse(content!.status);
//   //     // return +statusValue;
//   //     return 1
//   //   });
//   // }

//   // static accumulateNodeValues(node): void {
//   //   if (!node?.descendants) return;
//   //   while (node.descendants().some((node) => node.value > 1)) {
//   //     // Convert node values to binary based on whether their descendant nodes are all completed
//   //     node.each((node) => {
//   //       if (node.value > 1) {
//   //         node.value = cumulativeValue(node);
//   //       }
//   //     });
//   //   }
//   // }

//   activeOrNonActiveOpacity(d, dimmedOpacity: string): string {
//     if (
//       !this.activeNode ||
//       (!!this.activeNode &&
//         [d]
//           .concat(d?.parent?.children)
//           .concat(d?.parent?._children)
//           .concat(d?.children)
//           .concat(d?._children)
//           .concat(d?.parent)
//           .map((d) => d?.data?.content?.name)
//           .includes(this.activeNode.data.content.name))
//     )
//       return "1";

//     return dimmedOpacity;
//   }

//   getLinkPathGenerator(): void {
//     switch (this.type) {
//       case VisType.Tree:
//         //@ts-ignore
//         return linkVertical()
//           .x((d: any) => d.x)
//           .y((d: any) => d.y);
//       case VisType.Cluster:
//         //@ts-ignore
//         return linkHorizontal()
//           .x((d: any) => d.y)
//           .y((d: any) => d.x);
//       // case "radial":
//       //   return linkRadial()
//       //     .angle((d) => d.x / 8)
//       //     .radius((d) => d.y);
//     }
//   }

//   setLayout(): void {
//     switch (this.type) {
//       case VisType.Tree:
//         this.layout = tree()
//           .size(
//             [this._viewConfig.canvasWidth / 2,
//             this._viewConfig.canvasHeight / 2]
//           );
//         this.layout.nodeSize([this._viewConfig.dx as number, this._viewConfig.dy as number]);
//         break;
//       // case VisType.Cluster:
//       //   this.layout = cluster().size(
//       //     this._viewConfig.canvasWidth,
//       //     this._viewConfig.canvasHeight
//       //   );
//       //   this.layout.nodeSize([this._viewConfig.dx, this._viewConfig.dy]);
//       //   break;
//       // case "radial":
//       //   this.layout = cluster()
//       //     .size([360, this.canvasHeight * 2])
//       //     .separation((a, b) => (a.parent == b.parent ? 0.5 : 0.01) / a.depth);

//       //   this.layout.nodeSize(
//       //     this._viewConfig.isSmallScreen()
//       //       ? [300, 300]
//       //       : [
//       //           this.rootData.height > 4
//       //             ? (this._viewConfig.canvasHeight / this.rootData.height) * 8
//       //             : 400,
//       //           this.rootData.height > 4
//       //             ? (this._viewConfig.canvasHeight / this.rootData.height) * 8
//       //             : 400,
//       //         ]
//       //   );
//       //   break;
//     }

//     try {
//       this.layout(this.rootData);
//     } catch (error) {
//       console.error("Failed layout data", this.rootData, "! ", error);
//       console.error(error);
//     }
//   }

//   setNodeAndLinkGroups(): void {
//     !this.firstRender() && this.clearNodesAndLinks();

//     const transformation = this.type == VisType.Radial ? `rotate(90)` : "";
//     this._gLink = this._canvas
//       .append("g")
//       .classed("links", true)
//       .attr("transform", transformation);
//     this._gNode = this._canvas
//       .append("g")
//       .classed("nodes", true)
//       .attr("transform", transformation);
//   }

//   setNodeAndLinkEnterSelections(): void {
//     const nodes = this._gNode.selectAll("g.node").data(
//       this.rootData.descendants().filter((d) => {
//         const outOfBounds = outOfBoundsNode(d, this.rootData);
//         // Set new active node when this one is out of bounds
//         if (outOfBounds && this.activeNode?.data.name == d.data.name) {
//           this.rootData.isNew = true;
//           let newActive = this.rootData.find((n) => {
//             return !n.data.content.match(/OOB/);
//           });
//           this.setActiveNode(newActive || this.rootData);
//           this._zoomConfig.previousRenderZoom = { node: newActive };
//         }

//         return !outOfBounds;
//       })
//     ); // Remove habits that weren't being tracked then);
//     this._enteringNodes = nodes
//       .enter()
//       .append("g")
//       .attr("class", (d) => {
//         return this.activeNode &&
//           d.data.content === this.activeNode.data.content
//           ? "the-node solid active"
//           : "the-node solid";
//       })
//       .attr("data-testid", (d, i) => "test-node")
//       .style("fill", (d) => {
//         return nodeStatusColours(d);
//       })
//       .style("stroke", (d) =>
//         nodeStatusColours(d) === positiveColLighter
//           ? parentPositiveBorderCol
//           : noNodeCol
//       )
//       .style("opacity", (d) =>
//         this.type == VisType.Tree ? this.activeOrNonActiveOpacity(d, "0.5") : 1
//       )
//       .style("stroke-width", (d) =>
//         // !!this.activeNode && d.ancestors().includes(this.activeNode)
//         // TODO : memoize nodeStatus colours
//         nodeStatusColours(d) === positiveColLighter
//           ? "30px"
//           : "1px"
//       )
//       .attr("transform", (d) => {
//         if (this.type == VisType.Radial)
//           return `rotate(${((d.x / 8) * 180) / Math.PI - 90}) translate(${d.y
//             },0)`;
//         return this.type == VisType.Cluster
//           ? `translate(${d.y},${d.x})`
//           : `translate(${d.x},${d.y})`;
//       })
//       .call(this.bindEventHandlers.bind(this));

//     // Links
//     const links = this._gLink.selectAll("line.link").data(
//       this.rootData
//         .links()
//         .filter(
//           ({ source, target }) =>
//             !outOfBoundsNode(source, this.rootData) &&
//             !outOfBoundsNode(target, this.rootData)
//         ) // Remove habits that weren't being tracked then
//     );
//     this._enteringLinks = links
//       .enter()
//       .append("path")
//       .classed("link", true)
//       .attr("stroke", "#fefefe")
//       .attr("stroke-width", "3")
//       .attr("stroke-opacity", (d) => {
//           const parent = d.source?.data?.content;
//           const child = d.target?.data?.content;
//           if (!parent || !this.nodeDetails[parent] || !child || !this.nodeDetails[child]) return
//           const cachedNodeParent = Object.values(this.nodeDetails).find(n => n.eH == parent);
//           const cachedNodeChild = Object.values(this.nodeDetails).find(n => n.eH == child);
//           if(cachedNodeChild?.checked && cachedNodeParent?.checked) return 1;
//           return 0.5
//         }
//       )
//       .attr("d", this.getLinkPathGenerator())
//       .attr("transform", (d) => {
//         if (!d?.x) return "";
//         if (this.type == VisType.Radial)
//           return `rotate(${((d.x / 8) * 180) / Math.PI}) translate(${d.y},0)`;
//         return "";
//       });
//   }

//   clearNodesAndLinks(): void {
//     this._canvas.selectAll('g.nodes').remove();
//     this._canvas.selectAll('g.links').remove();
//   }

//   clearAndRedrawLabels(): void {
//     !this.firstRender() && this._canvas.selectAll(".tooltip").remove();

//     return this._enteringNodes
//       .append("g")
//       .classed("tooltip", true)
//       .append("foreignObject")
//       .attr("transform", () => {
//         return `scale(${this._viewConfig.isSmallScreen() ? 0.5 : 1})`
//       })
//       .attr("x", "-375")
//       .attr("y", "-10")
//       .attr("width", "650")
//       .style("overflow", "visible")
//       .attr("height", "650")
//       .html((d) => {
//         if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//         const cachedNode = this.nodeDetails[d.data.content];
//         const { name, description, scale } = cachedNode;
//         return `<div class="tooltip-inner">
//           <div class="content">
//           <span class="title">Name:</span>
//           <p>${name}</p>
//           <span class="title">Description:</span>
//           <p>${description || "<br />"}</p>
//           </div>
//         </div>`
//       });
//   }

//   setCircleAndLabelGroups(): void {
//     this._gCircle = this._enteringNodes
//       .append("g")
//       .classed("node-subgroup", true)
//       .attr("stroke-width", "0")
//       .classed("checked", (d) => {
//         if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//         const { checked } = this.nodeDetails[d.data.content];
//         return checked
//       });
//     this._gTooltip = this.clearAndRedrawLabels()
//   }

//   appendCirclesAndLabels(): void {
//     this._gCircle
//       .html((d) => {
//         if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//         const { scale } = this.nodeDetails[d.data.content];
//         switch (scale) {
//           case 'Atom': return '<ellipse id="circle1244" cx="59.97" cy="56.75" rx="54.09" ry="51.72" transform="translate(2.76 116.29) rotate(-89.56)" fill="#fff" stroke="currentColor" stroke-miterlimit="50" stroke-width="5.31"/><ellipse id="circle1246" cx="59.97" cy="56.68" rx="43.22" ry="45.42" fill="#997ae8" stroke="#37383a" stroke-miterlimit="50" stroke-width="4.79"/><path id="path1255" d="M42.92,27.11a2.23,2.23,0,0,0-3.47-1.79A38.23,38.23,0,0,0,24.81,47.56a2.29,2.29,0,0,0,2.47,2.85,2.55,2.55,0,0,0,2.14-2A33.34,33.34,0,0,1,41.83,29.56a2.71,2.71,0,0,0,1.09-2.45ZM63.76,94.52h0Z" fill="#fff" fill-rule="evenodd"/><ellipse id="circle1257" cx="25.28" cy="56.19" rx="2.34" ry="2.46" fill="#fff"/><path id="path1259" d="M98.21,17.16c-.46-3.73-1.73-6.12-3.41-7.55s-4.16-2.23-7.73-1.93-8,1.73-13,4.4q-1.94,1-3.94,2.3a2.17,2.17,0,0,1-1.63.29c-2-.45-2.67-3.28-.94-4.39C80,2.42,91.24.26,97.74,5.8c11.46,9.75,3.8,39.65-17.11,66.78S33.49,113.81,22,104.06c-6-5.1-6.75-15.7-3.13-28.54a2.28,2.28,0,0,1,4.28-.1,2.44,2.44,0,0,1,.14,1.7L23,78.47A39.54,39.54,0,0,0,21.57,92.7c.45,3.73,1.72,6.12,3.4,7.55s4.17,2.24,7.73,1.93,8-1.73,13-4.39C55.56,92.47,66.86,82.66,77,69.5S93.92,42.68,96.81,31.4a39.58,39.58,0,0,0,1.4-14.23Z" fill="#37383a" fill-rule="evenodd"/><path id="path1261" d="M46.79,82.53a2.26,2.26,0,0,1-2.29,1.33C19,81.05.22,70.53,0,57.64c-.14-8.27,7.42-15.85,19.56-21.21,1.86-.82,3.62,1.39,2.83,3.34A2.37,2.37,0,0,1,21.19,41c-.66.29-1.3.59-1.93.9A35.92,35.92,0,0,0,8,50c-2.42,2.76-3.34,5.32-3.31,7.59s1,4.79,3.56,7.47a35.8,35.8,0,0,0,11.54,7.6A86.42,86.42,0,0,0,44.9,79a2.49,2.49,0,0,1,1.89,3.55ZM52.7,81a2.38,2.38,0,0,1,2.2-1.39c1.85,0,3.73.06,5.63,0C76.64,79.38,91,76.06,101,71.14a36,36,0,0,0,11.27-8c2.42-2.76,3.35-5.32,3.31-7.59s-1.05-4.79-3.56-7.47a35.69,35.69,0,0,0-11.53-7.6c-.57-.26-1.16-.5-1.76-.75a4.19,4.19,0,0,1-2.16-2.09c-.79-1.69.69-3.71,2.37-3.07,12.92,4.91,21.17,12.38,21.31,20.89C120.55,70.92,93.83,84,60.61,84.58q-3,.06-5.92,0a2.43,2.43,0,0,1-2-3.52Z" fill="#37383a" fill-rule="evenodd"/><ellipse id="circle1263" cx="12.29" cy="14.42" rx="4.09" ry="4.3" fill="#fbc82b"/><ellipse id="circle1265" cx="20.58" cy="9.19" rx="1.75" ry="1.84" fill="#f7931b"/><ellipse id="circle1267" cx="101.91" cy="100.18" rx="2.92" ry="3.07" fill="#f7931b"/><ellipse id="circle1273" cx="58.57" cy="66.09" rx="2.34" ry="2.46" fill="#37383a"/><ellipse id="circle1275" cx="52.15" cy="60.63" rx="2.92" ry="3.07" fill="#37383a"/><ellipse id="circle1277" cx="51.26" cy="69.37" rx="1.17" ry="1.23" fill="#37383a"/>';
//           case 'Astro': return '<circle cx="60.91" cy="60.1" r="54.18" fill="#fff" stroke="currentColor" stroke-miterlimit="0" stroke-width="4.87"></circle><circle cx="60.91" cy="60.1" r="45.09" fill="#92a8d4" stroke="#3c3c3c" stroke-miterlimit="19.5" stroke-width="5"></circle><path d="M43.35,30.73a2.34,2.34,0,0,0-3.63-1.79A37.86,37.86,0,0,0,24.45,51,2.33,2.33,0,0,0,27,53.86a2.64,2.64,0,0,0,2.23-2,33,33,0,0,1,13-18.73A2.65,2.65,0,0,0,43.35,30.73Z" fill="#fff" fill-rule="evenodd"></path><circle cx="24.93" cy="59.59" r="2.44" fill="#fff"></circle><path d="M17.81,55.53A2.37,2.37,0,0,0,18.7,54c.3-2.08-2-3.74-3.71-2.45C4,60-1.79,69.4.49,77.35c4.24,14.78,34.69,19,68,9.47s56.9-29.28,52.66-44.07a14.94,14.94,0,0,0-6.15-8,2.26,2.26,0,0,0-3.31.95l-.88,1.77a.36.36,0,0,0,.14.47c3.22,1.89,4.89,4,5.51,6.2s.35,4.87-1.39,8.17-4.84,7-9.29,10.74c-8.9,7.44-22.47,14.49-38.63,19.13S35.75,88,24.26,86.38a37.51,37.51,0,0,1-13.57-4.17c-3.22-1.89-4.89-4-5.51-6.2s-.35-4.87,1.38-8.18a37.57,37.57,0,0,1,9.3-10.74q.95-.78,1.95-1.56Zm89.35-21.72a2.58,2.58,0,0,1-3,1.3,50.06,50.06,0,0,0-6.75-1.39c-.75-.1-1.51-.19-2.29-.27a2.38,2.38,0,0,1-1.56-.84c-1.36-1.61-.24-4.24,1.85-4a57.69,57.69,0,0,1,10.39,1.94A2.33,2.33,0,0,1,107.16,33.81Z" fill="#37383a" fill-rule="evenodd"></path><circle cx="76.96" cy="101.65" r="6.09" fill="#e83962" stroke="#37383a" stroke-miterlimit="19.5" stroke-width="2.8"></circle><circle cx="91.02" cy="8.53" r="6.09" fill="#e83962" stroke="#37383a" stroke-miterlimit="19.5" stroke-width="2.8"></circle><circle cx="62.6" cy="70.33" r="2.44" fill="#37383a"></circle><circle cx="33.89" cy="77.03" r="4.27" fill="#d2e1fb" stroke="#37383a" stroke-miterlimit="19.5" stroke-width="2.8"></circle><path d="M53.58,48.61a6.71,6.71,0,1,1-7.37-6,6.61,6.61,0,0,1,4.06.87,2.46,2.46,0,0,0,2.09.26,1.65,1.65,0,0,0,.57-2.89,10.35,10.35,0,1,0,4.28,7.34,1.41,1.41,0,0,0-2-1.09l-1.05.4A1,1,0,0,0,53.58,48.61Z" fill="#37383a" fill-rule="evenodd"></path>';
//           case 'Sub': return '<path id="circle1184" d="M110.83,51.07a54.37,54.37,0,0,1-48.39,59.76h0A54.37,54.37,0,0,1,2.68,62.44h0A54.37,54.37,0,0,1,51.07,2.68h0a54.37,54.37,0,0,1,59.76,48.39Z" fill="#fff" stroke="currentColor" stroke-miterlimit="37.8" stroke-width="4.75" style="stroke-opacity:1" /> <path id="circle1201" d="M102.75,51.92a46.25,46.25,0,1,1-92,9.67h0A46.25,46.25,0,0,1,51.92,10.76h0A46.25,46.25,0,0,1,102.75,51.92Z" fill="#7599ea" /> <path id="circle1203" d="M24.89,28.68a10.62,10.62,0,1,1-11.67-9.45h0a10.61,10.61,0,0,1,11.67,9.45Z" fill="#8b67e5" stroke="#37383a" stroke-miterlimit="37.8" stroke-width="5" style="stroke-width:3;stroke-miterlimit:37.79999924;stroke-dasharray:none" /> <path id="path1205" d="M100.26,52.18a43.73,43.73,0,1,1-22.94-34,2.64,2.64,0,0,0,3.18-.5,2.42,2.42,0,0,0-.57-3.78A48.67,48.67,0,1,0,99.84,33.93a2.41,2.41,0,0,0-3.93-.44,2.63,2.63,0,0,0-.36,3,43.76,43.76,0,0,1,4.71,15.68Z" fill="#37383a" fill-rule="evenodd" /> <path id="circle1210" d="M98.2,52.66a43.21,43.21,0,0,1-85.95,9h0A43.21,43.21,0,0,1,50.71,14.21h0A43.2,43.2,0,0,1,98.2,52.66Z" fill="#5380e5" /> <path id="path1214" d="M38.74,26.63A2.4,2.4,0,0,0,35,24.8,38.87,38.87,0,0,0,19.35,47.45,2.4,2.4,0,0,0,22,50.36a2.7,2.7,0,0,0,2.29-2A33.86,33.86,0,0,1,37.58,29.11,2.71,2.71,0,0,0,38.74,26.63Z" fill="#fff" fill-rule="evenodd" /> <path id="circle1226" d="M22.34,56a2.5,2.5,0,1,1-2.75-2.22h0A2.49,2.49,0,0,1,22.34,56Z" fill="#fff" /> <path id="circle1228" d="M25.58,65.06a1.87,1.87,0,0,1-1.67,2.06h0a1.87,1.87,0,0,1-2.06-1.67h0a1.87,1.87,0,0,1,1.67-2.06h0a1.87,1.87,0,0,1,2.06,1.67Z" fill="#37383a" /> <path id="circle1230" d="M68.2,58.06a1.88,1.88,0,0,1-1.67,2.07h0a1.88,1.88,0,0,1-2.06-1.67h0a1.87,1.87,0,0,1,1.67-2.06h0a1.87,1.87,0,0,1,2.06,1.66Z" fill="#37383a" /> <path id="circle1232" d="M38.3,60.58a3.12,3.12,0,1,1-3.43-2.78A3.12,3.12,0,0,1,38.3,60.58Z" fill="#37383a" /> <path id="circle1234" d="M105,100.7a3.12,3.12,0,1,1-3.43-2.78h0A3.13,3.13,0,0,1,105,100.7Z" fill="#8b67e5" /> <path id="circle1238" d="M92.45,19.7a6.87,6.87,0,1,1-7.55-6.12A6.87,6.87,0,0,1,92.45,19.7Z" fill="#fbc82b" stroke="#37383a" stroke-miterlimit="37.8" stroke-width="5" style="stroke-width:3;stroke-miterlimit:37.79999924;stroke-dasharray:none" />';
//         }
//       })
//       .on("mouseenter", this.eventHandlers.handleHover.bind(this));
//   }

//   appendNodeDetailsAndControls() {
//     this._gButton = this._gTooltip.select(".tooltip-inner")
//       .append("g")
//       .classed("tooltip-actions", true)
//       .append("foreignObject")
//       .attr("width", "550")
//       .style("overflow", "visible")
//       .attr("height", "550")
//       .html((d) => {
//         if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//         const { checked, scale, parentEh } = this.nodeDetails[d.data.content];
//         return `<div class="buttons">
//           <button class="tooltip-action-button higher-button ${!parentEh && scale !== 'Astro' ? 'hide' : 'hide'}"></button>
//           <img data-button="true" class="tooltip-action-button checkbox-button" src=${checked ? "assets/checkbox-checked.svg" : "assets/checkbox-empty.svg"} />
//           <button class="tooltip-action-button lower-button"></button>
//         </div>`
//       });
//   }

//   async refetchOrbits() {
//     const variables = { sphereEntryHashB64: this.sphereEh };
//     let data;
//     try {
//       const gql = await client;
//       data = await gql.query({ query: GetOrbitsDocument, variables, fetchPolicy: 'network-only' })
//       if (data?.data?.orbits) {
//         const orbits = (extractEdges(data.data.orbits) as Orbit[]);
//         const indexedOrbitData: Array<[ActionHashB64, OrbitNodeDetails]> = Object.entries(orbits.map(mapToCacheObject))
//           .map(([_idx, value]) => [value.id, value]);
//         this.cacheOrbits(indexedOrbitData);
//       }
//       console.log('refetched orbits :>> ', data);
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   async cacheOrbits(orbitEntries: Array<[ActionHashB64, OrbitNodeDetails]>) {
//     try {
//       store.set(nodeCache.setMany, orbitEntries)
//       this.nodeDetails = Object.entries(orbitEntries);
//       console.log('Sphere orbits fetched and cached!')
//     } catch (error) {
//       console.error('error :>> ', error);
//     }
//   }

//   bindEventHandlers(selection) {
//     selection
//       .on("contextmenu", this.eventHandlers.rgtClickOrDoubleTap)
//       .on("click", (e, d) => {
//         if (!["BUTTON", 'IMG'].includes(e.target.tagName)) return;
//         if(e.target.tagName == "IMG" && !e.target.dataset.button) return;

//         this.eventHandlers.handleNodeFocus.call(this, e, d);
//         switch (true) {
//           case e.target.classList.contains('checkbox-button'):
//             if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//             this.nodeDetails[d.data.content].checked = !(this.nodeDetails[d.data.content].checked);
//             e.target.classList.toggle('checked');
//             e.target.closest('.the-node').firstChild.classList.toggle('checked');

//             const parentAndChildChecked = (d: any) => {
//               const parent = d.source?.data?.content;
//               const child = d.target?.data?.content;
//               if (!parent || !this.nodeDetails[parent] || !child || !this.nodeDetails[child]) return
//               const cachedNodeParent = Object.values(this.nodeDetails).find(n => n.eH == parent);
//               const cachedNodeChild = Object.values(this.nodeDetails).find(n => n.eH == child);
//               return cachedNodeChild?.checked && cachedNodeParent?.checked
//             };
//             this._enteringLinks
//               .attr("stroke", (d) => {
//                 return parentAndChildChecked(d) ? 'rgba(11,254,184, 1)' : '#fefefe'
//               })
//               .attr("stroke-opacity", (d) => {
//                 return parentAndChildChecked(d) ? 1 : 0.35
//               }
//             )
//             if(false){ //TODO: Add condition to stop tearing
//               this._gTooltip.select(".tooltip-inner foreignObject").html((d) => {
//                 if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//                 const { checked, scale, parentEh } = this.nodeDetails[d.data.content];
//                 return `<div class="buttons">
//                   <button class="tooltip-action-button higher-button ${!parentEh && scale !== 'Astro' ? 'hide' : 'hide'}"></button>
//                   <img data-button="true" class="tooltip-action-button checkbox-button" src=${checked ? "assets/checkbox-checked.svg" : "assets/checkbox-empty.svg"} />
//                   <button class="tooltip-action-button lower-button"></button>
//                 </div>`
//               });
//             }
//             this.render();
//             break;

//           case e.target.classList.contains('higher-button'): // Prepend
//             if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//             this.eventHandlers.handlePrependNode.call(this, { childOrbitEh: this.nodeDetails[d.data.content].eH as string })
//             break;

//           case e.target.classList.contains('lower-button'): // Append
//             if (!d?.data?.content || !this.nodeDetails[d.data.content]) return
//             this.eventHandlers.handleAppendNode.call(this, { parentOrbitEh: this.nodeDetails[d.data.content].eH as string })
//             break;

//           default:
//             break;
//         }
//         // if (!this._gLink.attr("transform"))
//         //   // If it is not a radial vis
//         //   this.eventHandlers.handleNodeZoom.call(this, e, d, false);
//       })
//     // .on("touchstart", this.eventHandlers.handleHover.bind(this), {
//     //   passive: true,
//     // })
//     // .on("mouseleave", this.eventHandlers.handleMouseLeave.bind(this))
//     // .on(
//     //   "mouseenter",
//     //   debounce(this.eventHandlers.handleMouseEnter.bind(this), 450)
//     // );
//   }

//   // bindMobileEventHandlers(selection) {
//   //   this._manager = propagating(
//   //     new Hammer.Manager(document.body, { domEvents: true })
//   //   );
//   //   // Create a recognizer
//   //   const singleTap = new Hammer.Tap({ event: "singletap" });
//   //   const doubleTap = new Hammer.Tap({
//   //     event: "doubletap",
//   //     taps: 2,
//   //     interval: 800,
//   //   });
//   //   this._manager.add([doubleTap, singleTap]);
//   //   doubleTap.recognizeWith(singleTap);
//   //   singleTap.requireFailure(doubleTap);
//   //   //----------------------
//   //   // Mobile device events
//   //   //----------------------
//   //   selection.selectAll(".node-subgroup").on("touchstart", (e) => {
//   //     this._manager.set({ inputTarget: e.target });
//   //   });

//   //   this._manager.on("doubletap", (ev) => {
//   //     ev.srcEvent.preventDefault();
//   //     ev.srcEvent.stopPropagation();
//   //     // if (!isTouchDevice()) return;

//   //     const target = ev.firstTarget;
//   //     if (!target || target?.tagName !== "circle") return;

//   //     ev.srcEvent.stopPropagation();

//   //     let node = target?.__data__;
//   //     if (typeof node == "number") {
//   //       node = ev.target.parentNode?.__data__;
//   //     }
//   //     try {
//   //       this.eventHandlers.rgtClickOrDoubleTap.call(this, ev.srcEvent, node);
//   //     } catch (error) {
//   //       console.log("Problem with mobile doubletap: ", error);
//   //     }
//   //   });

//   //   this._manager.on("singletap", (ev) => {
//   //     ev.srcEvent.preventDefault();
//   //     if (
//   //       // !isTouchDevice() ||
//   //       ev.srcEvent.timeStamp === this.currentEventTimestamp || // Guard clause for callback firing twice
//   //       select(`#${this._svgId}`).empty() // Guard clause for wrong vis element
//   //     )
//   //       return;
//   //     this.currentEventTimestamp = ev.srcEvent.timeStamp;

//   //     let target = ev.target;
//   //     const node = target?.__data__;
//   //     if (!target || !node) return;

//   //     switch (ev?.target?.tagName) {
//   //       // Delete button is currently the only path
//   //       case "path":
//   //         this.eventHandlers.handleDeleteNode.call(this, ev, node.data);
//   //         break;
//   //       //@ts-ignore
//   //       case "rect":
//   //         if (target.parentNode.classList.contains("tooltip")) return; // Stop label from triggering
//   //       // Append or prepend are currently the only text
//   //       case "text":
//   //         const buttonTransitioning =
//   //           select(target.parentNode).attr("style") === "opacity: 0";
//   //         if (buttonTransitioning) return ev.srcEvent.stopPropagation();
//   //         this.setCurrentHabit(node.data);

//   //         // target.textContent == "DIVIDE"
//   //         //   ? this.eventHandlers.handleAppendNode.call(this)
//   //         //   : this.eventHandlers.handlePrependNode.call(this);
//   //         break;
//   //       default:
//   //         let parentNodeGroup = _.find(this._enteringNodes._groups[0], (n) => {
//   //           return n?.__data__?.data?.content == node?.data?.content;
//   //         });
//   //         target = parentNodeGroup;
//   //         try {
//   //           this.eventHandlers.handleMouseEnter.call(this, ev);
//   //           this.eventHandlers.handleNodeFocus.call(this, ev.srcEvent, node);
//   //           if (!this._gLink.attr("transform"))
//   //             this.eventHandlers.handleNodeZoom.call(
//   //               this,
//   //               ev.srcEvent,
//   //               node,
//   //               false
//   //             );
//   //           break;
//   //         } catch (error) {
//   //           console.error(error);
//   //         }
//   //     }
//   //   });
//   // }

//   activateNodeAnimation = debounce(() => {
//     // https://stackoverflow.com/questions/45349849/concentric-emanating-circles-d3
//     // Credit: Andrew Reid

//     // _p("animated node", this.activeNode, "!");
//     this.zoomBase().selectAll(".active-circle").remove();
//     // this.setNodeAnimationGroups();

//     let data = this.gCirclePulse.pulseData
//       .map((d) => {
//         return d == 2 * (this._viewConfig.nodeRadius as number)
//           ? 0
//           : d + this._viewConfig.nodeRadius;
//       })
//       .slice(0, -2);

//     // Grow circles
//     this.gCirclePulse.pulseCircles
//       .data(data)
//       .filter(function (d) {
//         return d > 0;
//       })
//       .transition()
//       .ease(easeCubic)
//       .attr("r", function (d) {
//         return d;
//       })
//       .style("stroke", this.gCirclePulse.pulseScale)
//       .style("opacity", (d) => {
//         return d == 3 * (this._viewConfig.nodeRadius as number) ? 0 : 1;
//       })
//       .duration(200);

//     //  pulseCircles where r == 0
//     this.gCirclePulse.pulseCircles
//       .filter(function (d) {
//         return d == 0;
//       })
//       .attr("r", 0)
//       .style("opacity", 1)
//       .style("stroke", this.gCirclePulse.pulseScale);
//   }, 800);

//   render() {
//     if (this.skipMainRender) return this.skipMainRender = false;
//     if (this.noCanvas()) {
//       this._canvas = select(`#${this._svgId}`)
//         .append("g")
//         .classed("canvas", true);
//     }

//     if (this.firstRender()) {
//       this.setNodeRadius();
//       this.setLevelsHighAndWide();
//       this.calibrateViewPortAttrs();
//       this.calibrateViewBox();
//       this.setdXdY();
//       this.setZoomBehaviour();
//     }

//     if (
//       this.firstRender() ||
//       this.hasNewHierarchyData()
//     ) {
//       // First render OR New hierarchy needs to be rendered

//       if (this.noCanvas()) return;
//       this.clearCanvas();

//       // Update the current day's rootData
//       if (this.hasNextData()) {
//         this.rootData = this._nextRootData;
//         delete this._nextRootData
//       }

//       this.setLayout();

//       this.setNodeAndLinkGroups();
//       this.setNodeAndLinkEnterSelections();
//       this.setCircleAndLabelGroups();

//       this.appendNodeDetailsAndControls();
//       // this.appendLinkPath();

//       this.appendCirclesAndLabels();

//       this.eventHandlers.handleNodeZoom.call(this, null, this.activeNode);

//       // this._viewConfig.isSmallScreen() &&
//       //   this.bindMobileEventHandlers(this._enteringNodes);

//       this._canvas.attr(
//         "transform",
//         `scale(${BASE_SCALE}), translate(${this._viewConfig.defaultCanvasTranslateX()}, ${this._viewConfig.defaultCanvasTranslateY()})`
//       );

//       console.log("BaseVis render complete... :>>");
//       this._hasRendered = true;
//     }

//     if (!select("svg.legend-svg").empty() && select("svg .legend").empty()) {
//       console.log("Added legend :>> ");
//       // this.addLegend();
//       // this.bindLegendEventHandler();
//     }
//   }
// }