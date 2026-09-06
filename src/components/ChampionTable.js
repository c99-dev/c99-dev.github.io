import React, { useMemo } from 'react';
import Icon from './Icon';
import { sortChampions } from '../utils/utils';
import '../styles/ChampionTable.css';

function ChampionTable({
  champions,
  teamName,
  reRoll,
  table,
  tableOptions,
  sortOption,
  tierDisplay,
  championImages,
  championRanking,
  tierImages,
}) {
  const sorted = useMemo(
    () => sortChampions(champions, sortOption, championRanking),
    [champions, sortOption, championRanking],
  );
  const blue = table === 'table1';
  return (
    <section
      className={`team-panel ${blue ? 'blue-team' : 'red-team'}`}
      aria-label={teamName}
    >
      <div className="team-heading">
        <div>
          <span className="team-indicator" />
          <h2>
            {teamName}
            <small>{blue ? 'BLUE SIDE' : 'RED SIDE'}</small>
          </h2>
        </div>
        <span className="team-count">
          {champions.length}
          <small> CHAMPIONS</small>
        </span>
      </div>
      <table className="champion-table" aria-label={`${teamName} 챔피언`}>
        <thead>
          <tr>
            <th scope="col">챔피언</th>
            {tableOptions.rank && <th scope="col">순위</th>}
            {tableOptions.winrate && <th scope="col">승률</th>}
            {tierDisplay && <th scope="col">티어</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((champion, index) => {
            const rank = championRanking[champion.name];
            return (
              <tr key={champion.id}>
                <td>
                  <button
                    className="champion-pick"
                    onClick={() =>
                      reRoll(
                        table,
                        champions.findIndex(item => item.id === champion.id),
                      )
                    }
                    aria-label={`${champion.name} 다시 뽑기`}
                  >
                    <span className="pick-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <img
                      className="champion-portrait"
                      src={
                        championImages[champion.id]?.url ||
                        `/image/champion/${champion.id}.png`
                      }
                      alt=""
                      width="36"
                      height="36"
                    />
                    <span className="champion-label">
                      {champion.name}
                      {tierDisplay && rank?.isOp && (
                        <small className="op-label">OP</small>
                      )}
                      {tierDisplay && rank?.isHoney && tierImages.honey && (
                        <img
                          className="honey-badge"
                          src={tierImages.honey}
                          alt="꿀챔"
                        />
                      )}
                    </span>
                    <span className="pick-refresh">
                      <Icon name="refresh" size={14} />
                    </span>
                  </button>
                </td>
                {tableOptions.rank && (
                  <td className="stat-cell">
                    {rank ? `#${rank.ranking}` : '—'}
                  </td>
                )}
                {tableOptions.winrate && (
                  <td className="stat-cell">
                    {rank ? `${Number(rank.winRate).toFixed(1)}%` : '—'}
                  </td>
                )}
                {tierDisplay && (
                  <td className="tier-cell">
                    <span
                      className={`tier-pill tier-${rank?.opTier || 'unknown'}`}
                    >
                      {rank ? `${rank.opTier} 티어` : '집계 중'}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!champions.length && (
        <p className="empty-team">밴을 해제하면 챔피언을 뽑을 수 있어요.</p>
      )}
    </section>
  );
}
export default React.memo(ChampionTable);
