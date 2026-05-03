import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Skill manifest schema
const SkillManifestSchema = z.object({
  name: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(10).max(500),
  author: z.string().optional(),
  license: z.string().default('MIT'),
  keywords: z.array(z.string()).default([]),
  
  // Skill metadata
  skill: z.object({
    name: z.string(),
    description: z.string(),
    runner: z.enum(['python', 'node', 'bash', 'docker']).default('node'),
    entry: z.string(),
    timeout: z.number().default(30000),
  }),
  
  // Dependencies
  dependencies: z.record(z.string()).default({}),
  
  // Security
  permissions: z.array(z.enum([
    'fs.read',
    'fs.write',
    'network',
    'shell',
    'env',
  ])).default([]),
});

// Vetting rules
const RULES = {
  // No hardcoded secrets
  NO_SECRETS: {
    id: 'NO_SECRETS',
    severity: 'critical',
    message: 'Potential secret detected in code',
    // Match actual hardcoded secrets like: const secret = "abc123xyz789..."
    // Requires: keyword, then assignment operator, then quoted string with 10+ chars
    // The keyword must be at the start of a token (not part of a longer word)
    pattern: /['"](?:api[_-]?key|secret|token|password)['"]\s*:\s*['"][A-Za-z0-9_\-]{10,}['"]|\b(?:api[_-]?key|secret|token|password)\s*=\s*['"][A-Za-z0-9_\-]{10,}['"]/gi,
  },
  
  // No eval() usage
  NO_EVAL: {
    id: 'NO_EVAL',
    severity: 'high',
    message: 'eval() usage detected - security risk',
    // Negative lookbehind to avoid matching regex patterns containing eval
    pattern: /(?<!\/.*)\beval\s*\(/g,
  },
  
  // No child_process without justification
  NO_SHELL: {
    id: 'NO_SHELL',
    severity: 'medium',
    message: 'child_process usage detected',
    pattern: /child_process|exec\(|spawn\(/g,
  },
  
  // Must have SKILL.md
  HAS_SKILL_MD: {
    id: 'HAS_SKILL_MD',
    severity: 'required',
    message: 'SKILL.md file is required',
  },
};

/**
 * Vet a skill directory
 */
export async function vetSkill(skillPath) {
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    checks: [],
  };

  // Check for SKILL.md
  try {
    await fs.access(path.join(skillPath, 'SKILL.md'));
    results.checks.push({ rule: 'HAS_SKILL_MD', status: 'pass' });
  } catch {
    results.errors.push({
      rule: 'HAS_SKILL_MD',
      message: 'SKILL.md file not found',
      severity: 'required',
    });
    results.passed = false;
  }

  // Check manifest
  let manifest;
  try {
    const manifestPath = path.join(skillPath, 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestData);
    
    // Validate schema
    SkillManifestSchema.parse(manifest);
    results.checks.push({ rule: 'VALID_MANIFEST', status: 'pass' });
  } catch (err) {
    results.errors.push({
      rule: 'VALID_MANIFEST',
      message: `Invalid manifest: ${err.message}`,
      severity: 'required',
    });
    results.passed = false;
  }

  // Scan all JS files for issues
  const jsFiles = await findFiles(skillPath, /\.js$/);
  for (const file of jsFiles) {
    const content = await fs.readFile(file, 'utf-8');
    
    // Check for secrets
    if (RULES.NO_SECRETS.pattern.test(content)) {
      results.errors.push({
        rule: 'NO_SECRETS',
        message: `Potential secret in ${path.relative(skillPath, file)}`,
        severity: 'critical',
      });
      results.passed = false;
    }
    
    // Check for eval
    if (RULES.NO_EVAL.pattern.test(content)) {
      results.warnings.push({
        rule: 'NO_EVAL',
        message: `eval() usage in ${path.relative(skillPath, file)}`,
        severity: 'high',
      });
    }
    
    // Check for shell usage
    if (RULES.NO_SHELL.pattern.test(content)) {
      results.warnings.push({
        rule: 'NO_SHELL',
        message: `Shell execution in ${path.relative(skillPath, file)}`,
        severity: 'medium',
      });
    }
  }

  return results;
}

/**
 * Recursively find files matching pattern
 */
async function findFiles(dir, pattern, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      await findFiles(fullPath, pattern, results);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}
