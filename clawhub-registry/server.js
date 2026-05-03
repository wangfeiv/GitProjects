#!/usr/bin/env node
/**
 * ClawHub Registry Server - MVP Version
 * Simple skill registry for OpenClaw skills
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'skills.json');
const TARBALL_PATH = path.join(__dirname, 'data', 'tarballs');

// Ensure data directories exist
async function init() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.mkdir(TARBALL_PATH, { recursive: true });
  
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
  }
}

// Read database
async function getSkills() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Save to database
async function saveSkills(skills) {
  await fs.writeFile(DB_PATH, JSON.stringify(skills, null, 2));
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    await handleRoute(req, res);
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

async function handleRoute(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // Health check
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'clawhub-registry', version: '0.1.0' }));
    return;
  }

  // Search skills
  if (pathname === '/v1/skills/search') {
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const sort = url.searchParams.get('sort') || 'downloads';
    
    let skills = await getSkills();
    
    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      skills = skills.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))
      );
    }
    
    // Sort
    if (sort === 'downloads') skills.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    if (sort === 'name') skills.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'rating') skills.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === 'updated') skills.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Limit
    skills = skills.slice(0, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skills));
    return;
  }

  // Get skill by name
  if (pathname.match(/^\/v1\/skills\/[^/]+$/)) {
    const name = pathname.split('/').pop();
    const skills = await getSkills();
    const skill = skills.find(s => s.name === name);
    
    if (!skill) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Skill not found' }));
      return;
    }
    
    // Increment download count
    skill.downloads = (skill.downloads || 0) + 1;
    await saveSkills(skills);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skill));
    return;
  }

  // List all skills
  if (pathname === '/v1/skills') {
    const skills = await getSkills();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skills));
    return;
  }

  // Publish skill
  if (pathname === '/v1/skills/publish' && req.method === 'POST') {
    const body = await parseBody(req);
    
    if (!body.manifest || !body.manifest.name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid manifest' }));
      return;
    }
    
    const manifest = body.manifest;
    const skills = await getSkills();
    
    // Check if exists
    const existingIndex = skills.findIndex(s => s.name === manifest.name);
    
    const skillData = {
      ...manifest,
      downloads: existingIndex >= 0 ? skills[existingIndex].downloads : 0,
      rating: existingIndex >= 0 ? skills[existingIndex].rating : 0,
      author: manifest.author || 'anonymous',
      createdAt: existingIndex >= 0 ? skills[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tarballUrl: 'http://localhost:1338/v1/skills/' + manifest.name + '/tarball',
    };
    
    // Save tarball if provided
    if (body.tarball) {
      const tarballFile = path.join(TARBALL_PATH, manifest.name + '-' + manifest.version + '.tgz');
      await fs.writeFile(tarballFile, Buffer.from(body.tarball, 'base64'));
    }
    
    if (existingIndex >= 0) {
      skills[existingIndex] = skillData;
    } else {
      skills.push(skillData);
    }
    
    await saveSkills(skills);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skillData));
    return;
  }

  // Download tarball
  if (pathname.match(/^\/v1\/skills\/[^/]+\/tarball$/)) {
    const name = pathname.split('/')[3];
    const skills = await getSkills();
    const skill = skills.find(s => s.name === name);
    
    if (!skill) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Skill not found' }));
      return;
    }
    
    const tarballFile = path.join(TARBALL_PATH, skill.name + '-' + skill.version + '.tgz');
    
    try {
      const tarball = await fs.readFile(tarballFile);
      res.writeHead(200, { 
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="' + skill.name + '-' + skill.version + '.tgz"'
      });
      res.end(tarball);
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Tarball not found' }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Seed sample skills with real skills from workspace
async function seedSampleSkills() {
  const skills = await getSkills();
  
  if (skills.length > 0) {
    console.log('Database already has skills, skipping seed');
    return;
  }
  
  // Sample skills from your workspace
  const sampleSkills = [
    {
      name: 'weather',
      version: '1.0.0',
      description: 'Get current weather and forecasts for any location',
      author: 'openclaw',
      keywords: ['weather', 'forecast', 'temperature'],
      skill: { runner: 'node', entry: 'index.js' },
      permissions: ['network'],
      downloads: 0,
      rating: 4.5,
    },
    {
      name: 'us-stock-analysis',
      version: '1.0.0',
      description: 'Comprehensive US stock analysis with fundamentals and technicals',
      author: 'openclaw',
      keywords: ['stock', 'finance', 'investment', 'analysis'],
      skill: { runner: 'node', entry: 'index.js' },
      permissions: ['network'],
      downloads: 0,
      rating: 4.8,
    },
    {
      name: 'duoduo-study',
      version: '1.0.0',
      description: 'Manage study error bank and review plans for elementary school',
      author: 'openclaw',
      keywords: ['education', 'study', 'math', 'chinese', 'english'],
      skill: { runner: 'node', entry: 'index.js' },
      permissions: ['fs.read', 'fs.write'],
      downloads: 0,
      rating: 5.0,
    },
    {
      name: 'gstack',
      version: '1.0.0',
      description: 'Fast headless browser for QA testing and site dogfooding',
      author: 'openclaw',
      keywords: ['browser', 'testing', 'qa', 'automation'],
      skill: { runner: 'node', entry: 'index.js' },
      permissions: ['network', 'shell'],
      downloads: 0,
      rating: 4.2,
    },
    {
      name: 'marketing-plan',
      version: '1.0.0',
      description: 'Marketing plan generator with web research and Word output',
      author: 'openclaw',
      keywords: ['marketing', 'business', 'planning'],
      skill: { runner: 'node', entry: 'index.js' },
      permissions: ['network', 'fs.write'],
      downloads: 0,
      rating: 4.0,
    },
    {
      name: 'tavily-web-search',
      version: '1.0.0',
      description: 'Web search using Tavily API for recent information',
      author: 'openclaw',
      keywords: ['search', 'web', 'research'],
      skill: { runner: 'python', entry: 'scripts/tavily_search.py' },
      permissions: ['network'],
      downloads: 0,
      rating: 4.3,
    },
  ];
  
  for (let i = 0; i < sampleSkills.length; i++) {
    sampleSkills[i].createdAt = new Date().toISOString();
    sampleSkills[i].updatedAt = new Date().toISOString();
    sampleSkills[i].tarballUrl = 'http://localhost:1338/v1/skills/' + sampleSkills[i].name + '/tarball';
  }
  
  await saveSkills(sampleSkills);
  console.log('Seeded ' + sampleSkills.length + ' sample skills');
}

const PORT = process.env.PORT || 1338;

async function start() {
  await init();
  await seedSampleSkills();
  
  server.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('');
    console.log('  ClawHub Registry v0.1.0');
    console.log('');
    console.log('  Server running on http://localhost:' + PORT);
    console.log('');
    console.log('  Endpoints:');
    console.log('  GET  /health           - Health check');
    console.log('  GET  /v1/skills        - List all skills');
    console.log('  GET  /v1/skills/search?q=QUERY');
    console.log('  GET  /v1/skills/:name  - Get skill');
    console.log('  POST /v1/skills/publish - Publish skill');
    console.log('');
    console.log('========================================');
    console.log('');
  });
}

start().catch(console.error);
