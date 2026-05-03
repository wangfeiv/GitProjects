#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { search } from './commands/search.js';
import { install } from './commands/install.js';
import { update } from './commands/update.js';
import { list } from './commands/list.js';
import { vet } from './commands/vet.js';
import { publish } from './commands/publish.js';

const program = new Command();

program
  .name('clawhub')
  .description('Manage OpenClaw skills from clawhub.com')
  .version('0.1.0');

// Register commands
program.addCommand(search);
program.addCommand(install);
program.addCommand(update);
program.addCommand(list);
program.addCommand(vet);
program.addCommand(publish);

// Global error handling
process.on('uncaughtException', (err) => {
  console.error(chalk.red('\n✖ Error:'), err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n✖ Error:'), reason);
  process.exit(1);
});

program.parse();
