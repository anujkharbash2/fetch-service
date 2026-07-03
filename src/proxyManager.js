const fs = require('fs');
const path = require('path');

class ProxyManager {
  constructor(proxyFilePath = path.join(__dirname, '..', 'proxies.json')) {
    const raw = JSON.parse(fs.readFileSync(proxyFilePath, 'utf-8'));
    this.proxies = raw.map(p => ({
      ...p,
      successCount: 0,
      failCount: 0,
      totalLatencyMs: 0,
      retired: false,
    }));
    this.cursor = 0;
  }

  // Score = success rate, weighted so new proxies aren't unfairly punished
  score(p) {
    const total = p.successCount + p.failCount;
    if (total === 0) return 1; // untested proxies get a neutral, optimistic score
    return p.successCount / total;
  }

  avgLatency(p) {
    return p.successCount > 0 ? p.totalLatencyMs / p.successCount : 0;
  }

  // Pick the next proxy: skip retired ones, round-robin among the rest,
  // but bias towards higher-scoring proxies once we have enough data.
  getNext() {
    const active = this.proxies.filter(p => !p.retired);
    if (active.length === 0) {
      throw new Error('ALL_PROXIES_RETIRED');
    }

    // Simple weighted approach: sort by score desc, take top half, round-robin within it
    const sorted = [...active].sort((a, b) => this.score(b) - this.score(a));
    const pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));

    const proxy = pool[this.cursor % pool.length];
    this.cursor++;
    return proxy;
  }

  recordSuccess(proxyId, latencyMs) {
    const p = this.proxies.find(x => x.id === proxyId);
    if (!p) return;
    p.successCount++;
    p.totalLatencyMs += latencyMs;
  }

  recordFailure(proxyId) {
    const p = this.proxies.find(x => x.id === proxyId);
    if (!p) return;
    p.failCount++;

    // Auto-retire: 5+ attempts and success rate below 30%
    const total = p.successCount + p.failCount;
    if (total >= 5 && this.score(p) < 0.3) {
      p.retired = true;
      console.warn(`Proxy ${proxyId} auto-retired (score: ${this.score(p).toFixed(2)})`);
    }
  }

  stats() {
    return this.proxies.map(p => ({
      id: p.id,
      score: this.score(p).toFixed(2),
      avgLatencyMs: Math.round(this.avgLatency(p)),
      retired: p.retired,
      attempts: p.successCount + p.failCount,
    }));
  }
}

module.exports = { ProxyManager };