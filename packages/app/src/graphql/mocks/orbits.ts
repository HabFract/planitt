import { aOrbitConnection } from './generated/mocks';

import CREATE_ORBIT from '../mutations/orbit/createOrbit.graphql';
import GET_ORBITS from '../queries/orbit/getOrbits.graphql';
import { Frequency, Scale } from './generated';

export const ORBITS_MOCKS = [{
  request: {
    query: GET_ORBITS,
    variables: {},
  },
  result: {
    data: {
      
      orbits: aOrbitConnection({edges: [
        {
          node: {
            id: 'R28gZm9yIGEgd2Fsay==', // Base64 for "Go for a walk"
            name: 'Go for a walk',
            metadata: {
              description: 'A daily walk to improve cardiovascular health.',
              frequency: Frequency.DAY,
              scale: Scale.ATOM,
            },
            timeframe: {
              startTime: 1617235200, // Mocked Unix timestamp for example
              endTime: 1617321600,   // Mocked Unix timestamp for example
            },
          },
          cursor: ''
        },
        {
          node: {
            id: 'TGlmdCB3ZWlnaHRz', // Base64 for "Lift weights"
            name: 'Lift weights',
            metadata: {
              description: 'Strength training to build muscle and increase metabolism.',
              frequency: Frequency.WEEK,
              scale: Scale.ATOM,
            },
            timeframe: {
              startTime: 1617235200, // Mocked Unix timestamp for example
              endTime: 1617321600,   // Mocked Unix timestamp for example
            },
          },
          cursor: ''
        },
        {
          node: {
            id: 'UmVhZCBhbiBpbnRlcmVzdGluZyBib29r', // Base64 for "Read an interesting book"
            name: 'Read an interesting book',
            metadata: {
              description: 'Reading to expand knowledge and relax the mind.',
              frequency: Frequency.DAY,
              scale: Scale.ASTRO,
            },
            timeframe: {
              startTime: 1617235200, // Mocked Unix timestamp for example
              endTime: 1617321600,   // Mocked Unix timestamp for example
            },
          },
          cursor: ''
        },
      ]})
    },
  },
},
{
  request: {
    query: CREATE_ORBIT,
    variables: {
      name: 'Go for a walk',
      metadata: {
        description: 'A daily walk to improve cardiovascular health.',
        frequency: Frequency.DAY,
        scale: Scale.ATOM,
      },
      timeframe: {
        startTime: 1617235200,
        endTime: 1617321600,
      },
    },
  },
  result: {
    data: {
      createOrbit: {
        actionHash: "bW9ja2VkQWN0aW9uSGFzaA==", // Base64 for "mockedActionHash"
        entryHash: "bW9ja2VkRW50cnlIYXNo", // Base64 for "mockedEntryHash"
      },
    },
  },
}
]
