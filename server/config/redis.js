const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

class InMemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.sets = new Map();
    this.expirations = new Map();
    console.log('[Redis] Running with in-memory Redis fallback adapter.');
  }

  async get(key) {
    if (this.expirations.has(key) && Date.now() > this.expirations.get(key)) {
      this.store.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, mode, seconds) {
    this.store.set(key, value);
    if (mode === 'EX' && seconds) {
      this.expirations.set(key, Date.now() + seconds * 1000);
    }
    return 'OK';
  }

  async ttl(key) {
    if (!this.store.has(key)) return -2;
    if (!this.expirations.has(key)) return -1;
    const remaining = Math.ceil((this.expirations.get(key) - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async del(key) {
    const deleted = this.store.delete(key);
    this.expirations.delete(key);
    return deleted ? 1 : 0;
  }

  async sadd(setName, ...members) {
    if (!this.sets.has(setName)) {
      this.sets.set(setName, new Set());
    }
    const set = this.sets.get(setName);
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(setName, ...members) {
    if (!this.sets.has(setName)) return 0;
    const set = this.sets.get(setName);
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) {
        removed++;
      }
    }
    return removed;
  }

  async smembers(setName) {
    if (!this.sets.has(setName)) return [];
    return Array.from(this.sets.get(setName));
  }

  async sismember(setName, member) {
    if (!this.sets.has(setName)) return 0;
    return this.sets.get(setName).has(member) ? 1 : 0;
  }

  async quit() {
    return 'OK';
  }
}

let redisClient;
const memoryFallback = new InMemoryRedisFallback();

try {
  const realClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null, // don't spam reconnection in local development if redis is absent
  });

  let isRealConnected = false;

  realClient.connect().then(() => {
    isRealConnected = true;
    console.log(`[Redis] Connected to live Redis instance at ${redisUrl}`);
  }).catch(() => {
    console.warn(`[Redis] Cannot connect to Redis at ${redisUrl}; using in-memory fallback cache.`);
  });

  realClient.on('error', (err) => {
    if (isRealConnected) {
      console.error(`[Redis] Connection error: ${err.message}`);
    }
  });

  // Proxy to delegate to real Redis if connected, otherwise fallback seamlessly
  redisClient = new Proxy(realClient, {
    get(target, prop) {
      if (!isRealConnected && typeof memoryFallback[prop] === 'function') {
        return (...args) => memoryFallback[prop](...args);
      }
      return typeof target[prop] === 'function'
        ? target[prop].bind(target)
        : target[prop];
    },
  });
} catch (e) {
  console.warn(`[Redis] Initializing in-memory fallback due to: ${e.message}`);
  redisClient = memoryFallback;
}

module.exports = redisClient;
