/**
 * Redis Performance Benchmarking Script
 * 
 * Usage: node scripts/benchmark-redis.js
 * 
 * This script measures response times with and without Redis caching
 * to demonstrate the performance improvement.
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const NUM_REQUESTS = 10;

// You need a valid JWT token. Get one by logging in first.
const TOKEN = process.env.TEST_TOKEN || 'YOUR_JWT_TOKEN_HERE';

const endpoints = [
  { name: 'Student Dashboard', path: '/api/student/dashboard' },
  { name: 'Student Profile', path: '/api/student/profile' },
  { name: 'Student Attendance', path: '/api/student/attendance' },
  { name: 'Forum Questions', path: '/api/forum/questions' },
];

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1e6; // Convert to milliseconds
        resolve({
          statusCode: res.statusCode,
          duration,
          cacheHit: res.headers['x-cache'] === 'HIT',
          size: data.length
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function benchmarkEndpoint(endpoint) {
  console.log(`\n📊 Benchmarking: ${endpoint.name} (${endpoint.path})`);
  console.log('─'.repeat(60));

  const results = [];
  
  for (let i = 0; i < NUM_REQUESTS; i++) {
    try {
      const result = await makeRequest(endpoint.path);
      results.push(result);
      
      const cacheStatus = result.cacheHit ? '🟢 HIT' : '🔴 MISS';
      console.log(`  Request ${i + 1}: ${result.duration.toFixed(2)}ms ${cacheStatus} (${result.statusCode})`);
    } catch (error) {
      console.log(`  Request ${i + 1}: ❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 100));
  }

  if (results.length === 0) return null;

  const durations = results.map(r => r.duration);
  const cacheMisses = results.filter(r => !r.cacheHit);
  const cacheHits = results.filter(r => r.cacheHit);

  const stats = {
    endpoint: endpoint.name,
    totalRequests: results.length,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    cacheHits: cacheHits.length,
    cacheMisses: cacheMisses.length,
    avgCacheHitMs: cacheHits.length > 0 
      ? cacheHits.reduce((a, b) => a + b.duration, 0) / cacheHits.length 
      : 0,
    avgCacheMissMs: cacheMisses.length > 0 
      ? cacheMisses.reduce((a, b) => a + b.duration, 0) / cacheMisses.length 
      : 0,
  };

  if (stats.avgCacheMissMs > 0 && stats.avgCacheHitMs > 0) {
    stats.improvement = ((stats.avgCacheMissMs - stats.avgCacheHitMs) / stats.avgCacheMissMs * 100).toFixed(1);
  }

  console.log(`\n  Summary:`);
  console.log(`    Average: ${stats.avgDuration.toFixed(2)}ms`);
  console.log(`    Min: ${stats.minDuration.toFixed(2)}ms | Max: ${stats.maxDuration.toFixed(2)}ms`);
  console.log(`    Cache Hits: ${stats.cacheHits} | Misses: ${stats.cacheMisses}`);
  if (stats.avgCacheHitMs > 0) {
    console.log(`    Avg Cache HIT: ${stats.avgCacheHitMs.toFixed(2)}ms`);
    console.log(`    Avg Cache MISS: ${stats.avgCacheMissMs.toFixed(2)}ms`);
    if (stats.improvement) {
      console.log(`    🚀 Performance Improvement: ${stats.improvement}%`);
    }
  }

  return stats;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  Campus Connect — Redis Cache Performance Benchmark');
  console.log('═'.repeat(60));
  console.log(`  Server: ${BASE_URL}`);
  console.log(`  Requests per endpoint: ${NUM_REQUESTS}`);
  console.log(`  Token: ${TOKEN.substring(0, 20)}...`);
  
  const allStats = [];

  for (const endpoint of endpoints) {
    const stats = await benchmarkEndpoint(endpoint);
    if (stats) allStats.push(stats);
  }

  // Overall summary
  console.log('\n' + '═'.repeat(60));
  console.log('  OVERALL RESULTS');
  console.log('═'.repeat(60));
  
  console.log('\n  Endpoint                  | Avg (ms) | HIT (ms) | MISS (ms) | Improvement');
  console.log('  ' + '─'.repeat(80));
  
  for (const s of allStats) {
    const name = s.endpoint.padEnd(25);
    const avg = s.avgDuration.toFixed(1).padStart(8);
    const hit = s.avgCacheHitMs.toFixed(1).padStart(8);
    const miss = s.avgCacheMissMs.toFixed(1).padStart(9);
    const imp = s.improvement ? `${s.improvement}%`.padStart(11) : 'N/A'.padStart(11);
    console.log(`  ${name} | ${avg} | ${hit} | ${miss} | ${imp}`);
  }

  console.log('\n✅ Benchmark complete.\n');
}

main().catch(console.error);
