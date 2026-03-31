/**
 * CLI Transport — renders 808 events as rich ANSI-colored output to a Writable stream.
 *
 * Implements TransportHandler with colored banners, step indicators, spawn markers,
 * and running cost totals. No external dependencies — ANSI codes are inline constants.
 */

import type { Writable } from 'node:stream';
import { agent808EventType, type agent808Event, type TransportHandler } from './types.js';

// ─── ANSI escape constants (no dependency per D021) ──────────────────────────

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[90m';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract HH:MM:SS from an ISO-8601 timestamp. */
function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '??:??:??';
    return d.toISOString().slice(11, 19);
  } catch {
    return '??:??:??';
  }
}

/** Truncate a string to `max` characters, appending '…' if truncated. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

/** Format a USD amount. */
function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ─── CLITransport ────────────────────────────────────────────────────────────

export class CLITransport implements TransportHandler {
  private readonly out: Writable;
  private runningCostUsd = 0;

  constructor(out?: Writable) {
    this.out = out ?? process.stdout;
  }

  /** Format and write a 808 event as a rich ANSI-colored line. Never throws. */
  onEvent(event: agent808Event): void {
    try {
      const line = this.formatEvent(event);
      this.out.write(line + '\n');
    } catch {
      // TransportHandler contract: onEvent must never throw
    }
  }

  /** No-op — stdout doesn't need cleanup. */
  close(): void {
    // Nothing to clean up
  }

  // ─── Private formatting ────────────────────────────────────────────

  private formatEvent(event: agent808Event): string {
    const time = formatTime(event.timestamp);

    switch (event.type) {
      case agent808EventType.SessionInit:
        return `[${time}] [INIT] Session started — model: ${event.model}, tools: ${event.tools.length}, cwd: ${event.cwd}`;

      case agent808EventType.SessionComplete:
        return `[${time}] ${GREEN}✓ Session complete — cost: ${usd(event.totalCostUsd)}, turns: ${event.numTurns}, duration: ${(event.durationMs / 1000).toFixed(1)}s${RESET}`;

      case agent808EventType.SessionError:
        return `[${time}] ${RED}✗ Session failed — subtype: ${event.errorSubtype}, errors: [${event.errors.join(', ')}]${RESET}`;

      case agent808EventType.ToolCall:
        return `[${time}] [TOOL] ${event.toolName}(${truncate(JSON.stringify(event.input), 80)})`;

      case agent808EventType.PhaseStart:
        return `${BOLD}${CYAN}━━━ 808 ► PHASE ${event.phaseNumber}: ${event.phaseName} ━━━${RESET}`;

      case agent808EventType.PhaseComplete:
        return `[${time}] [PHASE] Phase ${event.phaseNumber} complete — success: ${event.success}, cost: ${usd(event.totalCostUsd)}, running: ${usd(this.runningCostUsd)}`;

      case agent808EventType.PhaseStepStart:
        return `${CYAN}◆ ${event.step}${RESET}`;

      case agent808EventType.PhaseStepComplete:
        return event.success
          ? `${GREEN}✓ ${event.step}${RESET} ${DIM}${event.durationMs}ms${RESET}`
          : `${RED}✗ ${event.step}${RESET} ${DIM}${event.durationMs}ms${RESET}`;

      case agent808EventType.WaveStart:
        return `${YELLOW}⟫ Wave ${event.waveNumber} (${event.planCount} plans)${RESET}`;

      case agent808EventType.WaveComplete:
        return `[${time}] [WAVE] Wave ${event.waveNumber} complete — ${GREEN}${event.successCount} success${RESET}, ${RED}${event.failureCount} failed${RESET}, ${event.durationMs}ms`;

      case agent808EventType.CostUpdate: {
        this.runningCostUsd += event.sessionCostUsd;
        return `${DIM}[${time}] Cost: session ${usd(event.sessionCostUsd)}, running ${usd(this.runningCostUsd)}${RESET}`;
      }

      case agent808EventType.MilestoneStart:
        return `${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n${BOLD}  808 Milestone — ${event.phaseCount} phases${RESET}\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`;

      case agent808EventType.MilestoneComplete:
        return `${BOLD}━━━ Milestone complete — success: ${event.success}, cost: ${usd(event.totalCostUsd)}, running: ${usd(this.runningCostUsd)} ━━━${RESET}`;

      case agent808EventType.AssistantText:
        return `${DIM}[${time}] ${truncate(event.text, 200)}${RESET}`;

      case agent808EventType.InitResearchSpawn:
        return `${CYAN}◆ Spawning ${event.sessionCount} researchers...${RESET}`;

      // Generic fallback for event types without specific formatting
      default:
        return `[${time}] [EVENT] ${event.type}`;
    }
  }
}
