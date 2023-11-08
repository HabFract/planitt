import React from 'react';
import { PieChartOutlined, UnorderedListOutlined } from '@ant-design/icons'; // Import icons
import SpherePie from '../vis/SpherePie'; // Import the new SpherePie component
import { Sphere } from '../../graphql/mocks/generated';

type SphereCardProps = {
  sphere: Sphere;
};

const SphereCard: React.FC<SphereCardProps> = ({ sphere }) => {
  console.log('sphere :>> ', sphere);
  return (
    <div className="sphere-card flex flex-col">
      <header className="sphere-header">
        <h2 style={{ textAlign: 'center' }}>{sphere.name}</h2>
      </header>
      <div className="sphere-description">
        <p>{sphere.metadata?.description}</p>
        {sphere.metadata?.hashtag && <p>#{sphere.metadata.hashtag}</p>}
      </div>
      <div className="sphere-actions flex">
        <div className="actions" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <button>
            <PieChartOutlined />
            Visualise
          </button>
          <button>
            <UnorderedListOutlined />
            Orbits
          </button>
        </div>
        <div className="mini-vis" style={{ flex: 1 }}>
          <SpherePie />
        </div>
      </div>
    </div>
  );
};

export default SphereCard;
