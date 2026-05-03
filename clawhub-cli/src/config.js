import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export const CONFIG = {
  // ClawHub registry API
  registryUrl: process.env.CLAWHUB_REGISTRY || 'https://api.clawhub.com/v1',
  
  // Skill installation directory
  skillsDir: process.env.CLAWHUB_SKILLS_DIR || 
    path.join(os.homedir(), '.openclaw', 'workspace', 'skills'),
  
  // Cache directory
  cacheDir: path.join(os.homedir(), '.clawhub', 'cache'),
  
  // Config file path
  configFile: path.join(os.homedir(), '.clawhub', 'config.json'),
};

// Ensure directories exist
export async function ensureDirs() {
  await fs.mkdir(CONFIG.cacheDir, { recursive: true });
  await fs.mkdir(path.dirname(CONFIG.configFile), { recursive: true });
  await fs.mkdir(CONFIG.skillsDir, { recursive: true });
}

// Load config
export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG.configFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save config
export async function saveConfig(config) {
  await fs.writeFile(CONFIG.configFile, JSON.stringify(config, null, 2));
}
