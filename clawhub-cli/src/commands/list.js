import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { CONFIG } from '../config.js';

export const list = new Command('list')
  .description('List all installed skills')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const entries = await fs.readdir(CONFIG.skillsDir, { withFileTypes: true });
      const skillDirs = entries.filter(e => e.isDirectory());
      
      if (skillDirs.length === 0) {
        console.log(chalk.yellow('No skills installed.'));
        return;
      }
      
      console.log(chalk.bold(`\nInstalled skills (${skillDirs.length}):\n`));
      
      for (const dir of skillDirs) {
        const skillPath = path.join(CONFIG.skillsDir, dir.name);
        
        // Try to read manifest
        let manifest = null;
        try {
          const manifestData = await fs.readFile(path.join(skillPath, 'manifest.json'), 'utf-8');
          manifest = JSON.parse(manifestData);
        } catch {
          // No manifest
        }
        
        if (manifest) {
          console.log(`  ${chalk.cyan(manifest.name)} ${chalk.gray(`@${manifest.version}`)}`);
          console.log(`    ${manifest.description}`);
          if (options.verbose) {
            console.log(`    ${chalk.gray('Path:')} ${skillPath}`);
            console.log(`    ${chalk.gray('Keywords:')} ${manifest.keywords?.join(', ') || 'none'}`);
          }
        } else {
          console.log(`  ${chalk.yellow(dir.name)} ${chalk.gray('(no manifest)')}`);
        }
        console.log('');
      }
      
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });
