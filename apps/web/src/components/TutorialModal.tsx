interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>How To Play</h2>
        <div className="tutorial-text">
          <p>• Two players take turns placing X and O</p>
          <p>• Get 3 in a row to win!</p>
          <p>• Horizontal, vertical, or diagonal</p>
          <p>• First player uses X, second uses O</p>
        </div>
        <button className="modal-btn blue" type="button" onClick={onClose}>
          Got It!
        </button>
      </div>
    </div>
  );
}
