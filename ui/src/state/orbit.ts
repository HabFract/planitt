import { NODE_ENV } from "./../constants";
import { ActionHashB64, EntryHashB64 } from "@holochain/client";
import { atom } from "jotai";
import { appStateAtom } from "./store";
import { SphereOrbitNodeDetails, SphereOrbitNodes } from "./types/sphere";
import { Frequency, OrbitHashes, OrbitNodeDetails } from "./types/orbit";
import { Orbit, Frequency as GraphQLFrequency } from "../graphql/generated";
import { WinData } from "./types/win";
import { nodeCache } from "./store";
import { isLeafNodeHashAtom } from "./hierarchy";
import { AppState } from "./types/store";

/** ----------------------------------------------------- */

/** Helpers */

/** ----------------------------------------------------- */

/**
 * Decodes from the Rust/GraphQL string enum type into an easier to work with numerical representation from the Frequency namespace
 * @param frequency The frequency type as returned from GraphQL resolvers
 * @returns a frequency using our frontend type system
 */
export const decodeFrequency = (
  frequency: GraphQLFrequency
): Frequency.Rationals => {
  switch (frequency) {
    case GraphQLFrequency.OneShot:
      return Frequency.ONE_SHOT;
    case GraphQLFrequency.DailyOrMore_1d:
      return Frequency.DAILY_OR_MORE.DAILY;
    case GraphQLFrequency.DailyOrMore_2d:
      return Frequency.DAILY_OR_MORE.TWO;
    case GraphQLFrequency.DailyOrMore_3d:
      return Frequency.DAILY_OR_MORE.THREE;
    // case GraphQLFrequency.DailyOrMore_4d:
    //   return Frequency.DAILY_OR_MORE.FOUR;
    // case GraphQLFrequency.DailyOrMore_5d:
    //   return Frequency.DAILY_OR_MORE.FIVE;
    // case GraphQLFrequency.DailyOrMore_6d:
    //   return Frequency.DAILY_OR_MORE.SIX;
    // case GraphQLFrequency.DailyOrMore_7d:
    //   return Frequency.DAILY_OR_MORE.SEVEN;
    // case GraphQLFrequency.DailyOrMore_8d:
    //   return Frequency.DAILY_OR_MORE.EIGHT;
    // case GraphQLFrequency.DailyOrMore_9d:
    //   return Frequency.DAILY_OR_MORE.NINE;
    // case GraphQLFrequency.DailyOrMore_10d:
    //   return Frequency.DAILY_OR_MORE.TEN;
    case GraphQLFrequency.LessThanDaily_1w:
      return Frequency.LESS_THAN_DAILY.WEEKLY;
    case GraphQLFrequency.LessThanDaily_1m:
      return Frequency.LESS_THAN_DAILY.MONTHLY;
    case GraphQLFrequency.LessThanDaily_1q:
      return Frequency.LESS_THAN_DAILY.QUARTERLY;
    default:
      throw new Error(`Unsupported GraphQL frequency: ${frequency}`);
  }
};

/**
 * Transforms from graphQL repsonses into a form expected by state management
 * @returns {OrbitNodeDetails} A record of orbit nodes for the current sphere or null if no sphere is selected
 */
export const mapToCacheObject = (orbit: Orbit): OrbitNodeDetails => {
  const newFrequency = decodeFrequency(orbit.frequency);

  return {
    id: orbit.id,
    eH: orbit.eH,
    parentEh: orbit.parentHash || undefined,
    name: orbit.name,
    scale: orbit.scale,
    sphereHash: orbit.sphereHash,
    frequency: newFrequency,
    description: orbit.metadata?.description || "",
    startTime: orbit.metadata?.timeframe.startTime,
    endTime: orbit.metadata?.timeframe.endTime || undefined,
  };
};

/** ----------------------------------------------------- */

/** From IndexDB */

/** ----------------------------------------------------- */

/**
 * Derived atom for current SphereOrbitNodeDetails
 * @returns {SphereOrbitNodeDetails | null} A record of orbit nodes for the current sphere or null if no sphere is selected
 */
export const currentSphereOrbitNodeDetailsAtom =
  atom<SphereOrbitNodeDetails | null>((get) => {
    const state = get(appStateAtom);
    const currentSphereHash = state.spheres.currentSphereHash;
    if (!currentSphereHash) return null;

    const sphereOrbitNodeDetails =
      (get(nodeCache.item(currentSphereHash)) as SphereOrbitNodeDetails) ||
      null;
    return sphereOrbitNodeDetails;
  });
(currentSphereOrbitNodeDetailsAtom as any).testId =
  "currentSphereOrbitNodeDetailsAtom";

/**
 * Atom factory that creates an atom for getting orbit details from the IndexDB cache by entryhash.
 *
 * @param orbitEh - The ActionHashB64 of the orbit to retrieve.
 * @returns An atom that, when read, returns the OrbitNodeDetails for the specified orbitEh, or null if not found.
 */
export const getOrbitNodeDetailsFromEhAtom = (orbitEh: EntryHashB64) =>
  atom<OrbitNodeDetails | null>((get) => {
    const allSphereNodeDetails = get(nodeCache.entries)?.map(
      //@ts-ignore
      ([_sphereId, sphereNodeDetails]: [
        ActionHashB64,
        SphereOrbitNodeDetails,
      ]) => sphereNodeDetails
    ) as SphereOrbitNodeDetails[];
    const foundSphereEntry = allSphereNodeDetails?.find(
      (entry) => entry[orbitEh]
    );
    if (!allSphereNodeDetails || !foundSphereEntry) return null;

    const foundOrbitDetails = foundSphereEntry[orbitEh];
    return foundOrbitDetails || null;
  });
(getOrbitNodeDetailsFromEhAtom as any).testId = "getOrbitNodeDetailsFromEhAtom";

/**
 * Derived atom for current OrbitNodeDetails
 * @returns {OrbitNodeDetails | null} Details of the current Orbit's Node
 */
export const currentOrbitDetailsAtom = atom<OrbitNodeDetails | null>((get) => {
  const currentOrbitHash = get(currentOrbitIdAtom)?.id;
  if (!currentOrbitHash) return null;
  let hash = currentOrbitHash;
  // Failsafe in case action hash was stored instead of entry hash
  if (!hash.startsWith("uhCE")) {
    const eH = get(getOrbitEhFromId(currentOrbitHash));
    if (!eH) return null;
    hash = eH;
  }
  return get(getOrbitNodeDetailsFromEhAtom(hash));
});
(currentOrbitDetailsAtom as any).testId = "currentOrbitDetailsAtom";

/**
 * Atom factory that creates an atom for getting orbit details from the indexDB cache by ID.
 *
 * @param orbitId - The ActionHashB64 of the orbit to retrieve.
 * @returns An atom that, when read, returns the OrbitNodeDetails for the specified orbitId, or null if not found.
 */
export const getOrbitNodeDetailsFromIdAtom = (orbitId: ActionHashB64) =>
  atom<OrbitNodeDetails | null>((get) => {
    const eH = get(getOrbitEhFromId(orbitId));
    if (!eH || typeof eH !== "string") return null;

    return get(getOrbitNodeDetailsFromEhAtom(eH));
  });
(getOrbitNodeDetailsFromIdAtom as any).testId = "getOrbitNodeDetailsFromIdAtom";

/** Within CURRENT SPHERE context: */

/**
 * Selector atom to get the IndexDB cache item of ONE OF THE CURRENT SPHERE's orbits based on entry hash
 * @param eH - The EntryHash of the orbit to retrieve.
 * @returns {OrbitNodeDetails | null | undefined} the id of that orbit if it exists, null if it doesn't exist under that sphere or we couldn't get the pre-requisite details, undefined otherwise
 */
export const getCurrentSphereOrbitNodeDetailsFromEhAtom = (
  orbitEh: EntryHashB64
) =>
  atom((get) => {
    const state = get(appStateAtom);
    const currentSphereHash = state.spheres.currentSphereHash;
    const currentSphere = state.spheres.byHash[currentSphereHash];
    if (!currentSphere) return null;

    const sphereOrbitNodeDetails = get(
      nodeCache.item(currentSphereHash)
    ) as SphereOrbitNodeDetails;
    if (!sphereOrbitNodeDetails) return null;
    const orbitCacheItem = sphereOrbitNodeDetails[orbitEh];

    return orbitCacheItem || null;
  });

/**
 * Selector atom to get the startTime from a CURRENT SPHERE's ORBIT from the indexDB cache based on entry hash ( used primarily for sorting a hierarchy)
 * @param orbitEh - The EntryHashB64 of the orbit to retrieve.
 * @returns {number | null} the timestamp of that orbit if it exists, null otherwise
 */
export const getCurrentOrbitStartTimeFromEh = atom(
  (get) => (orbitEh: EntryHashB64) => {
    const cacheItem = get(getCurrentSphereOrbitNodeDetailsFromEhAtom(orbitEh));
    return cacheItem?.startTime || null;
  }
);

/** IndexDB/Mixed UNTESTED TODO: */
/**
 * Write-only atom for updating orbit details in IndexDB using its entry hash.
 *
 * @param {EntryHashB64} params.orbitEh - The entry hash of the orbit to update.
 * @param {Partial<OrbitNodeDetails>} params.update - The partial orbit details to update.
 *
 * This atom directly updates the orbit details in the indexDB cache.
 * If the orbit is not found, no update occurs.
 */

export const setOrbitWithEntryHashAtom = atom(
  null,
  (
    get,
    set,
    {
      orbitEh,
      update,
    }: { orbitEh: EntryHashB64; update: Partial<OrbitNodeDetails> }
  ) => {
    const prevState = get(appStateAtom);
    const orbitActionHash = Object.keys(prevState.orbitNodes.byHash).find(
      (key) => prevState.orbitNodes.byHash[key].eH === orbitEh
    );

    if (!orbitActionHash) return; // Orbit not found, no update

    const newState = {
      ...prevState,
      orbitNodes: {
        ...prevState.orbitNodes,
        byHash: {
          ...prevState.orbitNodes.byHash,
          [orbitActionHash]: {
            ...prevState.orbitNodes.byHash[orbitActionHash],
            ...update,
          },
        },
      },
    } as AppState;

    set(appStateAtom, newState);
  }
);

/**
 * Derived atom for determining if the current node is a leaf in any hierarchy
 * @returns {boolean | null}
 */
export const currentOrbitIsLeafAtom = atom<boolean | null>((get) => {
  const currentOrbitId = get(currentOrbitDetailsAtom)?.id;
  if (!currentOrbitId) return null;

  return get(isLeafNodeHashAtom(currentOrbitId));
});
(currentOrbitIsLeafAtom as any).testId = "currentOrbitIsLeafAtom";

/**
 * Gets the frequency of a given Orbit from IndexDB
 * @param orbitId The ActionHash of the orbit
 * @returns An atom that resolves to the frequency of the orbit, or null if the orbit doesn't exist
 */
export const getOrbitFrequency = (orbitId: ActionHashB64) => {
  const selectFrequency = atom<Frequency.Rationals | null>((get) => {
    const orbit = get(getOrbitNodeDetailsFromIdAtom(orbitId));
    return orbit?.frequency || null;
  });
  return selectFrequency;
};

/** ----------------------------------------------------- */

/** From AppState */

/** ----------------------------------------------------- */

/**
 * Derived atom for current SphereOrbitNodes
 * @returns {SphereOrbitNodes | null} A record of orbit nodes for the current sphere or null if no sphere is selected
 */
export const currentSphereOrbitNodesAtom = atom<SphereOrbitNodes | null>(
  (get) => {
    const state = get(appStateAtom);
    const currentSphereHash = state.spheres.currentSphereHash;
    const currentSphere = state.spheres.byHash[currentSphereHash];
    if (!currentSphere) return null;

    const sphereNodes: SphereOrbitNodes = {};
    Object.entries(state.orbitNodes.byHash).forEach(([nodeHash, orbitNode]) => {
      if (orbitNode.sphereHash === currentSphere.details.entryHash) {
        sphereNodes[nodeHash] = orbitNode;
      }
    });

    return Object.keys(sphereNodes).length > 0 ? sphereNodes : null;
  }
);

/**
 * Read-write atom for the current orbit EntryHash
 * Reads from and writes to the global app state
 * @returns {{id: EntryHashB64} | null} Details of the current Orbit's Node
 */
export const currentOrbitIdAtom = atom(
  (get): Partial<OrbitHashes> | null => {
    const state = get(appStateAtom);
    return state.orbitNodes.currentOrbitHash
      ? { id: state.orbitNodes.currentOrbitHash }
      : null;
  },
  (_get, set, newOrbitId: EntryHashB64) => {
    const prevState = _get(appStateAtom);
    const newState = {
      ...prevState,
      orbitNodes: {
        ...prevState.orbitNodes,
        currentOrbitHash: newOrbitId,
      },
    } as AppState;

    // NODE_ENV !== "test" && console.log("Setting orbit id :>> ", newState);

    set(appStateAtom, newState);
  }
);
(currentOrbitIdAtom as any).testId = "currentOrbitIdAtom";

/**
 * Selector atom to get the id of the orbit based on entry hash
 * @param orbitEh - The EntryHashB64 of the orbit to retrieve.
 * @returns {ActionHashB64 | null} the id of that orbit if it exists, null otherwise
 */
export const getOrbitIdFromEh = (orbitEh: EntryHashB64) =>
  atom((get) => {
    const state = get(appStateAtom);
    const orbitActionHash = Object.keys(state.orbitNodes.byHash).find(
      (key) => state.orbitNodes.byHash[key].eH === orbitEh
    );
    return orbitActionHash || null;
  });
(getOrbitIdFromEh as any).testId = "getOrbitIdFromEh";

/**
 * Selector atom to get the entry hash of the orbit based on id
 * @param id - The ActionHashB64 of the orbit to retrieve.
 * @returns {EntryHashB64 | null} the id of that orbit if it exists, null otherwise
 */
export const getOrbitEhFromId = (id: ActionHashB64) =>
  atom((get) => {
    const state = get(appStateAtom);
    const orbitEh = state.orbitNodes.byHash[id]?.eH;
    return orbitEh || null;
  });

/**
 * Gets the win data for a specific orbit
 * @param orbitId The ActionHash of the orbit
 * @returns An atom that resolves to the win data for the orbit, or an empty object if no data exists
 */
export const orbitWinDataAtom = (orbitId: ActionHashB64) => {
  const selectWinData = atom<WinData<Frequency.Rationals>>((get) => {
    const state = get(appStateAtom);
    return state.wins[orbitId] || {};
  });
  return selectWinData;
};
