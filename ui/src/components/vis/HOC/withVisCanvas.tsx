import React, { ComponentType, ReactNode, useEffect, useState } from 'react'

import "./vis.css";

import { Margins, VisProps, VisCoverage, IVisualization } from '../types';
import { select } from "d3-selection";
import { useAtomValue } from 'jotai';
import { useNodeTraversal } from '../../../hooks/useNodeTraversal';
import { HierarchyBounds, SphereHashes, SphereHierarchyBounds, currentOrbitCoords, currentOrbitId as currentOrbitIdAtom, currentSphere, currentSphereHierarchyBounds } from '../../../state/currentSphereHierarchyAtom';
import { DownOutlined, EnterOutlined, LeftOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import { WithVisCanvasProps } from '../types';
import { ActionHashB64, EntryHashB64 } from '@holochain/client';
import { Modal } from 'flowbite-react';
import { CreateOrbit } from '../../forms';
import { nodeCache, SphereOrbitNodes, store } from '../../../state/jotaiKeyValueStore';
import VisModal from '../../VisModal';

const defaultMargins: Margins = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 60,
};

const getCanvasDimensions = function () {
  const { height, width } = document.body.getBoundingClientRect();
  const canvasHeight = height - defaultMargins.top - defaultMargins.bottom;
  const canvasWidth = width - defaultMargins.right - defaultMargins.left;

  return { canvasHeight, canvasWidth };
};

const appendSvg = (mountingDivId: string, divId: string) => {
  return select(`#${divId}`).empty() &&
    select(`#${mountingDivId}`)
      .append("svg")
      .attr("id", `${divId}`)
      .attr("width", "100%")
      .attr("data-testid", "svg")
      .attr("height", "100%")
      .attr("style", "pointer-events: all");
};

export function withVisCanvas<T extends IVisualization>(Component: ComponentType<VisProps<T>>): ReactNode {
  const ComponentWithVis: React.FC<WithVisCanvasProps> = (_visParams: WithVisCanvasProps) => {
    const mountingDivId = 'vis-root'; // Declared at the router level
    const svgId = 'vis'; // May need to be declared dynamically when we want multiple vis on a page
    const [appendedSvg, setAppendedSvg] = useState<boolean>(false);
    const selectedSphere = store.get(currentSphere);

    if (!selectedSphere.actionHash) {
      console.error("No sphere context has been set!")
    }
    useEffect(() => {
      if (document.querySelector(`#${mountingDivId} #${svgId}`)) return
      const appended = !!appendSvg(mountingDivId, svgId);
      setAppendedSvg(appended)
    }, [selectedSphere.actionHash]);

    const { canvasHeight, canvasWidth } = getCanvasDimensions()
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentParentOrbitEh, setCurrentParentOrbitEh] = useState<EntryHashB64>();
    const [currentChildOrbitEh, setCurrentChildOrbitEh] = useState<EntryHashB64>();

    const sphereHierarchyBounds: SphereHierarchyBounds = useAtomValue(currentSphereHierarchyBounds);
    const { incrementBreadth,
      decrementBreadth,
      incrementDepth,
      decrementDepth,
      maxBreadth,
      setBreadthIndex,
      maxDepth
    } = useNodeTraversal(sphereHierarchyBounds[selectedSphere!.entryHash as keyof SphereHierarchyBounds] as HierarchyBounds);

    return (
      <>
        <Component
          canvasHeight={canvasHeight}
          canvasWidth={canvasWidth}
          margin={defaultMargins}
          selectedSphere={selectedSphere}
          render={(currentVis: T, queryType: VisCoverage, x, y, newRootData) => {
            // Determine need for traversal controls
            const withTraversal: boolean = queryType !== VisCoverage.CompleteOrbit;
            let onlyChildParent: boolean = true;
            let hasChild: boolean = newRootData?.data?.children && newRootData?.data?.children.length > 0;
            let hasOneChild: boolean = newRootData?.data?.children && newRootData?.data?.children.length == 1;
            
            console.log('coordsChanged! :>> ', currentVis?._nextRootData?._translationCoords);
            if (appendedSvg) {
              currentVis.isModalOpen = false;
              // Pass through setState handlers for the current append/prepend Node parent/child entry hashes
              currentVis.modalOpen = setIsModalOpen;
              currentVis.modalParentOrbitEh = setCurrentParentOrbitEh;
              currentVis.modalChildOrbitEh = setCurrentChildOrbitEh;



              onlyChildParent = currentVis.rootData.parent == null || (currentVis.rootData.parent?.children && currentVis.rootData.parent?.children.length == 1 || true);
              // Trigger the Vis object render function only once the SVG is appended to the DOM
              currentVis?.render();
            }

            function coordsChanged(translationCoords): boolean {
              if (typeof translationCoords == 'undefined') return false
              return translationCoords[0] !== x || translationCoords[1] !== y
            }

            return (
              <>
                {!!(withTraversal && y !== 0) && <EnterOutlined data-testid={"traversal-button-up"} className='fixed text-3xl text-title hover:text-primary hover:cursor-pointer' style={{left: "3px", top: "23vh", transform: "scaley(-1)"}}  onClick={decrementDepth} />}
                {!!(withTraversal && x !== 0) && <LeftOutlined data-testid={"traversal-button-left"} className='fixed left-1 text-3xl text-title hover:text-primary hover:cursor-pointer' style={{top: "29vh"}} onClick={decrementBreadth} />}
                {!!(withTraversal && hasChild && !hasOneChild) && <EnterOutlined data-testid={"traversal-button-down-left"} className='fixed text-3xl text-title hover:text-primary hover:cursor-pointer' style={{left: "3px", top: "35vh", transform: "rotate(90deg), scalex(-1)"}}  onClick={incrementDepth} />}

                {!!(withTraversal && maxBreadth && x < maxBreadth) && <RightOutlined data-testid={"traversal-button-right"} className='fixed right-1 text-3xl text-title hover:text-primary hover:cursor-pointer' style={{top: "29vh"}}  onClick={incrementBreadth} />}
                {!!(withTraversal && hasChild && hasOneChild) && <RightOutlined data-testid={"traversal-button-down"} className='fixed text-3xl text-title hover:text-primary hover:cursor-pointer' style={{right: "43vw", bottom: "43vh", transform: "rotate(90deg)"}}  onClick={incrementDepth} />}
                {!!(withTraversal && maxDepth && y < maxDepth && !onlyChildParent) && <DownOutlined data-testid={"traversal-button-down-right"} className='fixed text-3xl text-title hover:text-primary hover:cursor-pointer' style={{right: "12vw", bottom: "45vh", transform: "rotate(-45deg)"}}  onClick={() => {incrementDepth(); setBreadthIndex(currentVis.rootData.data.children.length-1);}} />}

                {VisModal<T>(isModalOpen, setIsModalOpen, selectedSphere, currentParentOrbitEh, currentChildOrbitEh, currentVis)}
              </>
            )
          }}
        ></Component>
      </>
    );
  }
  //@ts-ignore
  return <ComponentWithVis />
}

