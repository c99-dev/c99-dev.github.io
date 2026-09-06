import React from 'react';
import '../styles/SkeletonLoader.css';

function SkeletonLoader({
  type = 'default',
  count = 1,
  width = '100%',
  height = '20px',
  className = '',
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'champion':
        return (
          <div className="skeleton-champion">
            <div className="skeleton-champion-image" />
            <div className="skeleton-champion-name" />
          </div>
        );

      case 'champion-ban':
        return (
          <div className="skeleton-champion-ban">
            <div className="skeleton-champion-image" />
            <div className="skeleton-champion-name" />
          </div>
        );

      case 'champion-table':
        return (
          <div className="skeleton-champion-table">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="skeleton-champion-row">
                <div className="skeleton-champion-cell">
                  <div className="skeleton-champion-image" />
                  <div className="skeleton-champion-info">
                    <div className="skeleton-champion-name" />
                  </div>
                </div>
                <div className="skeleton-champion-rank" />
                <div className="skeleton-champion-winrate" />
                <div className="skeleton-champion-tier" />
              </div>
            ))}
          </div>
        );

      case 'champion-grid':
        return (
          <div className="skeleton-champion-grid">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="skeleton-champion-grid-item">
                <div className="skeleton-champion-image" />
                <div className="skeleton-champion-name" />
              </div>
            ))}
          </div>
        );

      case 'app-loading':
        return (
          <div className="skeleton-app-loading">
            <div className="skeleton-header" />
            <div className="skeleton-content">
              <div className="skeleton-team">
                <div className="skeleton-team-header" />
                <div className="skeleton-team-table">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="skeleton-champion-row">
                      <div className="skeleton-champion-cell">
                        <div className="skeleton-champion-image" />
                        <div className="skeleton-champion-info">
                          <div className="skeleton-champion-name" />
                        </div>
                      </div>
                      <div className="skeleton-champion-rank" />
                      <div className="skeleton-champion-winrate" />
                      <div className="skeleton-champion-tier" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="skeleton-reroll-button" />
              <div className="skeleton-team">
                <div className="skeleton-team-header" />
                <div className="skeleton-team-table">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="skeleton-champion-row">
                      <div className="skeleton-champion-cell">
                        <div className="skeleton-champion-image" />
                        <div className="skeleton-champion-info">
                          <div className="skeleton-champion-name" />
                        </div>
                      </div>
                      <div className="skeleton-champion-rank" />
                      <div className="skeleton-champion-winrate" />
                      <div className="skeleton-champion-tier" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div
            className={`skeleton-default ${className}`}
            style={{ width, height }}
          />
        );
    }
  };

  return <div className="skeleton-loader">{renderSkeleton()}</div>;
}

export default React.memo(SkeletonLoader);
