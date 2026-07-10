const KEY = 'tictactok_device_id';
const NAME_KEY = 'tictactok_display_name';

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  return localStorage.getItem(NAME_KEY) || 'Player';
}

export function setDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 20) || 'Player');
}
