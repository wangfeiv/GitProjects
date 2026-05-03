import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { vetSkill } from '../skill-vetter.js';

export const vet = new Command('vet')
  .description('Vet a skill directory for security and quality issues')
  .argument('[path]', 'Path to skill directory', '.')
  .action(async (skillPath) => {
    const fullPath = path.resolve(skillPath);
    
    console.log(chalk.bold(`\nVetting skill at: ${fullPath}\n`));
    
    const results = await vetSkill(fullPath);
    
    // Display errors
    if (results.errors.length > 0) {
      console.log(chalk.red.bold('✗ ERRORS:'));
      for (const error of results.errors) {
        console.log(`  ${chalk.red('✗')} [${error.severity.toUpperCase()}] ${error.message}`);
      }
      console.log('');
    }
    
    // Display warnings
    if (results.warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠ WARNINGS:'));
      for (const warning of results.warnings) {
        console.log(`  ${chalk.yellow('⚠')} [${warning.severity.toUpperCase()}] ${warning.message}`);
      }
      console.log('');
    }
    
    // Display passed checks
    if (results.checks.length > 0) {
      console.log(chalk.green.bold('✓ PASSED CHECKS:'));
      for (const check of results.checks) {
        console.log(`  ${chalk.green('✓')} ${check.rule}`);
      }
      console.log('');
    }
    
    // Summary
    if (results.passed) {
      console.log(chalk.green.bold('✓ Skill passed all required checks!'));
      if (results.warnings.length > 0) {
        console.log(chalk.yellow(`  (with ${results.warnings.length} warning(s) - review recommended)`));
      }
      process.exit(0);
    } else {
      console.log(chalk.red.bold(`✗ Skill failed vetting (${results.errors.length} error(s))`));
      process.exit(1);
    }
  });
