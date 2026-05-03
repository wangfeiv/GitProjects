import { Command } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';
import { CONFIG } from '../config.js';

export const search = new Command('search')
  .description('Search for skills on clawhub.com')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-s, --sort <field>', 'Sort by: name, downloads, rating, updated', 'downloads')
  .action(async (query, options) => {
    const spinner = ora('Searching skills...').start();
    
    try {
      const response = await fetch(
        `${CONFIG.registryUrl}/skills/search?q=${encodeURIComponent(query)}&limit=${options.limit}&sort=${options.sort}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const results = await response.json();
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow('No skills found matching your query.'));
        return;
      }
      
      console.log(chalk.bold(`\nFound ${results.length} skill(s):\n`));
      
      for (const skill of results) {
        console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray(`@${skill.version}`)}`);
        console.log(`    ${skill.description}`);
        console.log(`    ${chalk.gray(`↓ ${skill.downloads} | ⭐ ${skill.rating.toFixed(1)} | by ${skill.author}`)}`);
        console.log('');
      }
      
    } catch (err) {
      spinner.fail('Search failed');
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });
