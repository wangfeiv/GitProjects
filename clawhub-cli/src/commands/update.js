import { Command } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import { CONFIG } from '../config.js';

export const update = new Command('update')
  .description('Update installed skills')
  .argument('[skill-name]', 'Specific skill to update (all if omitted)')
  .option('--dry-run', 'Show what would be updated without changing anything')
  .action(async (skillName, options) => {
    const spinner = ora('Checking for updates...').start();
    
    try {
      const entries = await fs.readdir(CONFIG.skillsDir, { withFileTypes: true });
      const skillDirs = entries.filter(e => e.isDirectory());
      
      const toUpdate = [];
      
      for (const dir of skillDirs) {
        if (skillName && dir.name !== skillName) continue;
        
        const skillPath = path.join(CONFIG.skillsDir, dir.name);
        
        try {
          const manifestData = await fs.readFile(path.join(skillPath, 'manifest.json'), 'utf-8');
          const localManifest = JSON.parse(manifestData);
          
          // Check remote
          const response = await fetch(`${CONFIG.registryUrl}/skills/${dir.name}`);
          if (response.ok) {
            const remoteManifest = await response.json();
            
            if (semver.gt(remoteManifest.version, localManifest.version)) {
              toUpdate.push({
                name: dir.name,
                current: localManifest.version,
                latest: remoteManifest.version,
              });
            }
          }
        } catch {
          // Skip skills without manifest or not on registry
        }
      }
      
      spinner.stop();
      
      if (toUpdate.length === 0) {
        console.log(chalk.green('All skills are up to date.'));
        return;
      }
      
      console.log(chalk.bold(`\n${toUpdate.length} update(s) available:\n`));
      
      for (const skill of toUpdate) {
        console.log(`  ${chalk.cyan(skill.name)}: ${skill.current} → ${chalk.green(skill.latest)}`);
      }
      
      if (options.dryRun) {
        console.log(chalk.gray('\nDry run - no changes made.'));
        return;
      }
      
      // TODO: Actually perform updates
      console.log(chalk.yellow('\nRun `clawhub install <skill-name> --force` to update each skill.'));
      
    } catch (err) {
      spinner.fail('Update check failed');
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });
