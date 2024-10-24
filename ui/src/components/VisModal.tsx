import { EntryHashB64, ActionHashB64 } from "@holochain/client";
import { Modal } from "flowbite-react";

import { currentSphereOrbitNodeDetailsAtom, currentSphereOrbitNodesAtom } from "../state/orbit";
import { SphereOrbitNodeDetails, SphereHashes } from "../state/types/sphere";
import { store } from "../state/store";
import { CreateOrbit } from "./forms";
import { IVisualization } from "./vis/types";

export default function VisModal<T extends IVisualization>(
  isModalOpen: boolean,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedSphere: SphereHashes,
  currentParentOrbitEh: string | undefined,
  currentChildOrbitEh: string | undefined,
  currentVis: T,
) {
  return (
    <Modal
      show={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
    >
      <Modal.Header>Create Orbit</Modal.Header>
      <Modal.Body>
        <CreateOrbit
          editMode={false}
          inModal={true}
          sphereEh={selectedSphere!.entryHash as EntryHashB64}
          parentOrbitEh={currentParentOrbitEh}
          childOrbitEh={currentChildOrbitEh}
          onCreateSuccess={() => {
            setIsModalOpen(false);
            currentVis.isModalOpen = false; // TODO, let this happen on cancel by adding onCancel callback
            currentVis.nodeDetails = store.get(
              currentSphereOrbitNodeDetailsAtom,
            ) as SphereOrbitNodeDetails;
            currentVis.setNodeAndLinkGroups.call(currentVis);
            currentVis.setNodeAndLinkEnterSelections.call(currentVis);
            currentVis.setNodeAndLabelGroups.call(currentVis);
            currentVis.appendNodeVectors.call(currentVis);
            currentVis.appendLinkPath.call(currentVis);
            currentVis.skipMainRender = true;
          }}
        ></CreateOrbit>
      </Modal.Body>
    </Modal>
  );
}
