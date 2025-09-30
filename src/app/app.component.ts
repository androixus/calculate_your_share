import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';

type PlayerStatus = 'playing' | 'left' | 'finalized';

interface Player {
  name: string;
  totalMinutes: number;
  currentStart?: number;        // epoch ms when resumed/started
  status: PlayerStatus;
  lastLeaveAt?: number;         // when they left early
}

interface AppState {
  players: Player[];
  gameStopped: boolean;
  totalCost: number | null;
  savedAt: number;
  version: 1;
}

const COOKIE_NAME = 'game_session';
const COOKIE_HOURS = 5;
const STORAGE_PREFIX = 'gr::';

function generateSessionName(): string {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SESSION-${ts}-${rnd}`;
}

function setCookie(name: string, value: string, hours: number) {
  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name: string): string | null {
  const key = encodeURIComponent(name) + '=';
  for (const raw of document.cookie.split(';')) {
    const c = raw.trim();
    if (c.startsWith(key)) return decodeURIComponent(c.slice(key.length));
  }
  return null;
}

function storageKeyFor(sessionName: string) {
  return `${STORAGE_PREFIX}${sessionName}::state`;
}

function safeLoadState(sessionName: string): AppState | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(sessionName));
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<AppState>;
    if (!s || typeof s !== 'object') return null;
    const players: Player[] = Array.isArray(s.players) ? s.players.map((p: any) => ({
      name: String(p.name),
      totalMinutes: Number(p.totalMinutes) || 0,
      currentStart: typeof p.currentStart === 'number' ? p.currentStart : undefined,
      status: (p.status as PlayerStatus) ?? 'left',
      lastLeaveAt: typeof p.lastLeaveAt === 'number' ? p.lastLeaveAt : undefined
    })) : [];
    return {
      players,
      gameStopped: !!s.gameStopped,
      totalCost: s.totalCost == null ? null : Number(s.totalCost),
      savedAt: Number(s.savedAt) || Date.now(),
      version: 1
    };
  } catch { return null; }
}
function safeSaveState(sessionName: string, state: AppState) {
  try {
    localStorage.setItem(storageKeyFor(sessionName), JSON.stringify(state));
  } catch {}
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  sessionName = signal<string>(getCookie(COOKIE_NAME) || generateSessionName());
  gameStopped = signal<boolean>(false);
  totalCost = signal<number | null>(null);
  players = signal<Player[]>([]);

  private minuteTick$ = interval(60_000);

  constructor() {
    // ensure cookie exists / refresh expiry
    setCookie(COOKIE_NAME, this.sessionName(), COOKIE_HOURS);

    // load persisted state
    this.loadFromStorage(this.sessionName());

    // refresh cookie + tick update
    this.minuteTick$.subscribe(() => {
      setCookie(COOKIE_NAME, this.sessionName(), COOKIE_HOURS);
      this.players.set([...this.players()]);
    });

    // auto-persist changes
    effect(() => {
      const snapshot: AppState = {
        players: this.players(),
        gameStopped: this.gameStopped(),
        totalCost: this.totalCost(),
        savedAt: Date.now(),
        version: 1
      };
      safeSaveState(this.sessionName(), snapshot);
    });
  }

  // Commands

  onNewGame() {
    if (!confirm('Are you sure you want a new game?')) return;
    this.players.set([]);
    this.gameStopped.set(false);
    this.totalCost.set(null);
    const newName = generateSessionName();
    this.sessionName.set(newName);
    setCookie(COOKIE_NAME, newName, COOKIE_HOURS);
    safeSaveState(newName, { players: [], gameStopped: false, totalCost: null, savedAt: Date.now(), version: 1 });
  }

  onAddPlayer() {
    if (this.gameStopped()) {
      alert('Game is stopped. Cannot add new players.');
      return;
    }
    const name = prompt('Enter player name:')?.trim();
    if (!name) return;

    const list = [...this.players()];
    const now = Date.now();
    let p = list.find(x => x.name.toLowerCase() === name.toLowerCase());

    if (!p) {
      p = { name, totalMinutes: 0, currentStart: now, status: 'playing' };
      list.push(p);
    } else {
      if (p.status === 'playing') {
        alert(`${p.name} is already playing.`);
      } else {
        p.currentStart = now;
        p.status = 'playing';
      }
    }
    this.players.set(list);
  }

  onLeave(player: Player) {
    if (player.status !== 'playing' || !player.currentStart) return;
    const now = Date.now();
    player.totalMinutes += this.roundUpMinutes(now - player.currentStart);
    player.currentStart = undefined;
    player.status = 'left';
    player.lastLeaveAt = now; // record leave time
    this.players.set([...this.players()]);
  }

  onStopGame() {
    if (this.gameStopped()) {
      alert('Game already stopped.');
      return;
    }
    const now = Date.now();
    const list = this.players().map(p => {
      if (p.status === 'playing' && p.currentStart) {
        p.totalMinutes += this.roundUpMinutes(now - p.currentStart);
        p.currentStart = undefined;
      }
      p.status = 'finalized';
      return p;
    });
    this.players.set(list);
    this.gameStopped.set(true);
  }

  onTotalCost() {
    if (!this.gameStopped()) {
      alert('You must stop the game before entering the total cost.');
      return;
    }
    const val = prompt('Enter total rent cost:');
    if (val == null) return;
    const num = Number(val.replace(',', '.'));
    if (!isFinite(num) || num < 0) {
      alert('Please enter a valid non-negative number.');
      return;
    }
    this.totalCost.set(num);
  }

  // Computations

  liveMinutes(p: Player): number {
    if (p.status !== 'playing' || !p.currentStart) return 0;
    return this.roundUpMinutes(Date.now() - p.currentStart);
  }
  displayedMinutes(p: Player): number {
    return p.totalMinutes + this.liveMinutes(p);
  }
  totalPlayedMinutes = computed(() =>
    this.players().reduce((acc, p) => acc + this.displayedMinutes(p), 0)
  );
  shareFor(p: Player): number | null {
    const total = this.totalCost();
    if (total == null) return null;
    const sum = this.totalPlayedMinutes();
    if (sum <= 0) return 0;
    return total * (this.displayedMinutes(p) / sum);
  }

  // Utils

  private roundUpMinutes(ms: number): number {
    const m = Math.ceil(ms / 60000);
    return Math.max(1, m);
  }

  trackByName = (_: number, p: Player) => p.name;

  private loadFromStorage(session: string) {
    const s = safeLoadState(session);
    if (!s) return;
    this.players.set(s.players);
    this.gameStopped.set(s.gameStopped);
    this.totalCost.set(s.totalCost);
  }
}
