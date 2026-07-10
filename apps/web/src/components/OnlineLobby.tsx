import { useState } from 'react';
import { getDisplayName } from '../lib/deviceId';

interface Props {
  waiting: boolean;
  onFindMatch: (displayName: string) => void;
  onCancel: () => void;
}

export default function OnlineLobby({ waiting, onFindMatch, onCancel }: Props) {
  const [name, setName] = useState(getDisplayName());

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Play Online</h2>
        {!waiting ? (
          <>
            <input
              className="name-input"
              value={name}
              maxLength={20}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
            />
            <button className="modal-btn orange" type="button" onClick={() => onFindMatch(name)}>
              Find Match
            </button>
          </>
        ) : (
          <>
            <p>Looking for an opponent...</p>
            <button className="modal-btn blue" type="button" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
