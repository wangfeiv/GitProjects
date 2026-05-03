import { Command } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import tar from 'tar';
import { CONFIG, ensureDirs } from '../config.js';
import { vetSkill } from '../skill-vetter.js';

export const install = new Command('install')
  .description('Install a skill from clawhub.com')
  .argument('<skill-name>', 'Skill name (with optional @version)')
  .option('--no-vet', 'Skip security vetting (not recommended)')
  .option('-f, --force', 'Force reinstall even if already installed')
  .action(async (skillName, options) => {
    await ensureDirs();
    
    // Parse name and version
    const [name, version] = skillName.split('@');
    const spinner = ora(`Installing ${name}...`).start();
    
    try {
      // Fetch skill info
      const versionSuffix = version ? `/${version}` : '';
      const response = await fetch(`${CONFIG.registryUrl}/skills/${name}${versionSuffix}`);
      
      if (!response.ok) {
        throw new Error(`Skill not found: ${name}${version ? `@${version}` : ''}`);
      }
      
      const skill = await response.json();
      spinner.text = `Downloading ${skill.name}@${skill.version}...`;
      
      // Download tarball
      const tarballResponse = await fetch(skill.tarballUrl);
      if (!tarballResponse.ok) {
        throw new Error('Failed to download skill tarball');
      }
      
      const tarballPath = path.join(CONFIG.cacheDir, `${skill.name}-${skill.version}.tgz`);
      const arrayBuffer = await tarballResponse.arrayBuffer();
      await fs.writeFile(tarballPath, Buffer.from(arrayBuffer));
      
      // Extract to temp dir for vetting
      const tempDir = path.join(CONFIG.cacheDir, 'vetting', skill.name);
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(tempDir, { recursive: true });
      
      await tar.x({
        file: tarballPath,
        cwd: tempDir,
        strip: 1,
      });
      
      // Security vetting
      if (options.vet) {
        spinner.text = `Vetting ${skill.name} for security issues...`;
        const vetResults = await vetSkill(tempDir);
        
        if (!vetResults.passed) {
          spinner.fail('Security vetting failed');
          console.log('\n' + chalk.red.bold('✗ VETTING FAILED'));
          console.log(chalk.red('The following issues were found:\n'));
          
          for (const error of vetResults.errors) {
            console.log(`  ${chalk.red('✗')} [${error.severity.toUpperCase()}] ${error.message}`);
          }
          
          for (const warning of vetResults.warnings) {
            console.log(`  ${chalk.yellow('⚠')} [${warning.severity.toUpperCase()}] ${warning.message}`);
          }
          
          console.log('\nUse --no-vet to install anyway (not recommended).');
          process.exit(1);
        }
      }
      
      // Install to final location
      const installDir = path.join(CONFIG.skillsDir, skill.name);
      
      if (!options.force) {
        try {
          await fs.access(installDir);
          throw new Error(`Skill already installed at ${installDir}. Use --force to reinstall.`);
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
      }
      
      await fs.rm(installDir, { recursive: true, force: true });
      await fs.rename(tempDir, installDir);
      
      // Run npm install if package.json exists
      const pkgPath = path.join(installDir, 'package.json');
      try {
        await fs.access(pkgPath);
        spinner.text = 'Installing dependencies...';
        
        const { execSync } = await import('child_process');
        execSync('npm install', { cwd: installDir, stdio: 'pipe' });
      } catch {
        // No package.json, that's fine
      }
      
      spinner.succeed(`Installed ${chalk.cyan(skill.name)}@${skill.version}`);
      console.log(`  ${chalk.gray('Location:')} ${installDir}`);
      
    } catch (err) {
      spinner.fail('Installation failed');
      console.error(chalk.red('\nError:'), err.message);
      process.exit(1);
    }
  });
