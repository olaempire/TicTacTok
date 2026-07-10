import { useEffect, useState } from 'react';
import { fetchStats } from '../lib/api';
import { getDeviceId } from '../lib/deviceId';
import type { Stats } from '../types';

interface Props {
  onClose: () => void;
}

export default function StatsModal({ onClose }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStats(getDeviceId())
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>My Stats</h2>
        {loading && <p>Loading...</p>}
        {error && <p>Couldn't load stats — is the API running?</p>}
        {stats && !loading && !error && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Games Played</div>
              <div className="stat-value">{stats.games_played}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Wins</div>
              <div className="stat-value">{stats.wins}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Losses</div>
              <div className="stat-value">{stats.losses}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Draws</div>
              <div className="stat-value">{stats.draws}</div>
            </div>
          </div>
        )}
        <p className="stats-note">Only Online games count toward these stats.</p>
        <button className="modal-btn yellow" type="button" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
