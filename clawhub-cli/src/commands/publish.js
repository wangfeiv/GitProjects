import { Command } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import tar from 'tar';
import prompts from 'prompts';
import { CONFIG, loadConfig, saveConfig, ensureDirs } from '../config.js';
import { vetSkill } from '../skill-vetter.js';

export const publish = new Command('publish')
  .description('Publish a skill to clawhub.com')
  .argument('[path]', 'Path to skill directory', '.')
  .option('--no-vet', 'Skip security vetting (not recommended)')
  .action(async (skillPath, options) => {
    await ensureDirs();
    
    const fullPath = path.resolve(skillPath);
    const config = await loadConfig();
    
    // Check auth
    if (!config.authToken) {
      console.log(chalk.yellow('You need to authenticate first.\n'));
      
      const response = await prompts([
        {
          type: 'text',
          name: 'token',
          message: 'Enter your ClawHub API token:',
        },
      ]);
      
      if (!response.token) {
        console.log(chalk.red('Authentication cancelled.'));
        process.exit(1);
      }
      
      config.authToken = response.token;
      await saveConfig(config);
    }
    
    const spinner = ora('Publishing skill...').start();
    
    try {
      // Vet first
      if (options.vet) {
        spinner.text = 'Vetting skill...';
        const vetResults = await vetSkill(fullPath);
        
        if (!vetResults.passed) {
          spinner.fail('Vetting failed');
          console.log(chalk.red('\nFix the issues and try again, or use --no-vet to skip.'));
          process.exit(1);
        }
      }
      
      // Read manifest
      const manifestData = await fs.readFile(path.join(fullPath, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestData);
      
      // Create tarball
      spinner.text = 'Creating tarball...';
      const tarballPath = path.join(CONFIG.cacheDir, `${manifest.name}-${manifest.version}.tgz`);
      
      await tar.c(
        {
          gzip: true,
          file: tarballPath,
          cwd: fullPath,
        },
        ['.']
      );
      
      // Upload
      spinner.text = 'Uploading to clawhub.com...';
      
      const tarballContent = await fs.readFile(tarballPath);
      
      const response = await fetch(`${CONFIG.registryUrl}/skills/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manifest,
          tarball: tarballContent.toString('base64'),
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Publish failed: ${error}`);
      }
      
      const result = await response.json();
      spinner.succeed('Published successfully!');
      
      console.log(`\n  ${chalk.cyan(result.name)}@${result.version}`);
      console.log(`  ${chalk.gray('URL:')} https://clawhub.com/skills/${result.name}`);
      
    } catch (err) {
      spinner.fail('Publish failed');
      console.error(chalk.red('\nError:'), err.message);
      process.exit(1);
    }
  });
