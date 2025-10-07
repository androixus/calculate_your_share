import { Component, computed, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type PlayerStatus = 'playing' | 'left' | 'finalized';

interface Player {
  name: string;
  totalMinutes: number;
  currentStart?: number;
  joinAt?: number;
  status: PlayerStatus;
  lastLeaveAt?: number;
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
    const players: Player[] = Array.isArray(s.players)
      ? s.players.map((p: any) => ({
          name: String(p.name),
          totalMinutes: Number(p.totalMinutes) || 0,
          currentStart: typeof p.currentStart === 'number' ? p.currentStart : undefined,
          joinAt: typeof p.joinAt === 'number' ? p.joinAt : undefined,
          status: (p.status as PlayerStatus) ?? 'left',
          lastLeaveAt: typeof p.lastLeaveAt === 'number' ? p.lastLeaveAt : undefined,
        }))
      : [];
    return {
      players,
      gameStopped: !!s.gameStopped,
      totalCost: s.totalCost == null ? null : Number(s.totalCost),
      savedAt: Number(s.savedAt) || Date.now(),
      version: 1,
    };
  } catch {
    return null;
  }
}
function safeSaveState(sessionName: string, state: AppState) {
  try {
    localStorage.setItem(storageKeyFor(sessionName), JSON.stringify(state));
  } catch {}
}

/* ==== Time-only helpers (HH:mm) ==== */
function pad2(n: number) { return n.toString().padStart(2, '0'); }
function toHM(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function combineDateAndHM(dateMs: number | undefined, hm: string): number | undefined {
  if (!hm || dateMs == null) return undefined;
  const m = /^(\d{2}):(\d{2})$/.exec(hm);
  if (!m) return undefined;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (isNaN(hh) || isNaN(mm)) return undefined;
  const d = new Date(dateMs);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  sessionName = signal<string>(getCookie(COOKIE_NAME) || generateSessionName());
  gameStopped = signal<boolean>(false);
  totalCost = signal<number | null>(null);
  players = signal<Player[]>([]);
  gameStartAt = signal<number | null>(null);

  editing = signal<{
    name: string;
    status: PlayerStatus;
    joinDateMs?: number;
    joinTime: string;
    leaveDateMs?: number;
    leaveTime: string;
    readonlyNote?: string;
  } | null>(null);
  private editingRef: Player | null = null;

  private tickIntervalId: any = null;

  constructor() {
    setCookie(COOKIE_NAME, this.sessionName(), COOKIE_HOURS);
    this.loadFromStorage(this.sessionName());
    this.startAlignedTicker();

    effect(() => {
      const snapshot: AppState = {
        players: this.players(),
        gameStopped: this.gameStopped(),
        totalCost: this.totalCost(),
        savedAt: Date.now(),
        version: 1,
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
    this.gameStartAt.set(null);
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
    let p = list.find((x) => x.name.toLowerCase() === name.toLowerCase());

    if (!p) {
      p = { name, totalMinutes: 0, currentStart: now, joinAt: now, status: 'playing' };
      list.push(p);
      if (!this.gameStartAt()) this.gameStartAt.set(now);
    } else {
      if (p.status === 'playing') {
        alert(`${p.name} is already playing.`);
      } else {
        p.currentStart = now;
        p.joinAt = now;
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
    player.lastLeaveAt = now;
    this.players.set([...this.players()]);
  }

  onStopGame() {
    if (this.gameStopped()) {
      alert('Game already stopped.');
      return;
    }
    const confirmed = confirm('Are you sure you want to stop the game? This will end all active players.');
    if (!confirmed) return;

    const now = Date.now();
    const list = this.players().map((p) => {
      if (p.status === 'playing' && p.currentStart) {
        p.totalMinutes += this.roundUpMinutes(now - p.currentStart);
        p.currentStart = undefined;
        p.lastLeaveAt = now; // ensure Left shows stop time
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

  // Clickable name -> edit modal
  onClickPlayer(p: Player) {
    if (p.status === 'finalized') {
      this.editing.set({
        name: p.name,
        status: p.status,
        joinDateMs: p.joinAt,
        joinTime: toHM(p.joinAt),
        leaveDateMs: p.lastLeaveAt,
        leaveTime: toHM(p.lastLeaveAt),
        readonlyNote: 'This player was finalized when the game stopped and cannot be edited.',
      });
      this.editingRef = null;
      return;
    }
    this.editing.set({
      name: p.name,
      status: p.status,
      joinDateMs: p.joinAt,
      joinTime: toHM(p.joinAt),
      leaveDateMs: p.lastLeaveAt,
      leaveTime: toHM(p.lastLeaveAt),
    });
    this.editingRef = p;
  }

  closeEdit() {
    this.editing.set(null);
    this.editingRef = null;
  }

  saveEdit() {
    const modal = this.editing();
    if (!modal || !this.editingRef) { this.closeEdit(); return; }

    const p = this.editingRef;
    const now = Date.now();
    const newJoin = combineDateAndHM(p.joinAt ?? now, modal.joinTime);
    const newLeave = (p.status === 'left')
      ? combineDateAndHM(p.lastLeaveAt ?? p.joinAt ?? now, modal.leaveTime)
      : undefined;

    if (!newJoin) { alert('Please set a valid Joined time (HH:mm).'); return; }
    if (newJoin > now) { alert('Joined cannot be in the future.'); return; }

    if (p.status === 'playing') {
      p.joinAt = newJoin;
      p.currentStart = newJoin;
      this.players.set([...this.players()]);
      this.closeEdit();
      return;
    }

    if (p.status === 'left') {
      if (!newLeave) { alert('Please set a valid Left time (HH:mm).'); return; }
      if (newLeave < newJoin) { alert('Left must be after Joined.'); return; }
      if (newLeave > now) { alert('Left cannot be in the future.'); return; }

      const prevLatest = (p.joinAt && p.lastLeaveAt)
        ? this.roundUpMinutes(p.lastLeaveAt - p.joinAt)
        : 0;
      const newLatest = this.roundUpMinutes(newLeave - newJoin);
      const delta = newLatest - prevLatest;

      p.totalMinutes = Math.max(0, p.totalMinutes + delta);
      p.joinAt = newJoin;
      p.lastLeaveAt = newLeave;

      this.players.set([...this.players()]);
      this.closeEdit();
      return;
    }

    this.closeEdit();
  }

  // Derived
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

  // Ticker for zoneless refresh
  private startAlignedTicker() {
    const TICK_MS = 20_000;
    const now = Date.now();
    const msToNext = TICK_MS - (now % TICK_MS);
    setTimeout(() => {
      this.players.set([...this.players()]);
      this.tickIntervalId = setInterval(() => this.players.set([...this.players()]), TICK_MS);
    }, msToNext);
  }

  ngOnDestroy() {
    if (this.tickIntervalId) clearInterval(this.tickIntervalId);
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
