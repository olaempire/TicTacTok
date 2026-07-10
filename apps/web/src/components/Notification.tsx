interface Props {
  message: string;
  type: 'winner-x' | 'winner-o' | 'tie' | '';
  show: boolean;
}

export default function Notification({ message, type, show }: Props) {
  return (
    <div className={`notification ${show ? 'show' : ''} ${type}`}>
      <div className="notification-content">{message}</div>
    </div>
  );
}
