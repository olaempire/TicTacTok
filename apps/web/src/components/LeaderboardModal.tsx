import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../lib/api';
import type { LeaderboardEntry } from '../types';

interface Props {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal">
      <div className="modal-content leaderboard-content">
        <h2>Leaderboards</h2>
        {loading && <p>Loading...</p>}
        {error && <p>Couldn't load leaderboard — is the API running?</p>}
        {!loading && !error && (
          <div className="leaderboard-list">
            {entries.length === 0 && <p>No games played yet. Be the first!</p>}
            {entries.map((entry, i) => (
              <div className="leaderboard-row" key={`${entry.display_name}-${i}`}>
                <span className="leaderboard-rank">#{i + 1}</span>
                <span className="leaderboard-name">{entry.display_name}</span>
                <span className="leaderboard-wins">{entry.wins}W</span>
                <span className="leaderboard-rate">{entry.win_rate}%</span>
              </div>
            ))}
          </div>
        )}
        <button className="modal-btn green" type="button" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
