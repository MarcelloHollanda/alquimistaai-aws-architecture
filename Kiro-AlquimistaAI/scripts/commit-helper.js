#!/usr/bin/env node

/**
 * Commit Helper Script
 * Helps developers create conventional commits
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const commitTypes = {
  'feat': 'A new feature',
  'fix': 'A bug fix',
  'docs': 'Documentation only changes',
  'style': 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
  'refactor': 'A code change that neither fixes a bug nor adds a feature',
  'perf': 'A code change that improves performance',
  'test': 'Adding missing tests or correcting existing tests',
  'build': 'Changes that affect the build system or external dependencies',
  'ci': 'Changes to our CI configuration files and scripts',
  'chore': 'Other changes that don\'t modify src or test files',
  'revert': 'Reverts a previous commit'
};

const scopes = [
  'fibonacci', 'nigredo', 'alquimista', 'mcp', 'lambda', 'database', 
  'api', 'auth', 'security', 'monitoring', 'ci', 'docs', 'tests'
];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function displayTypes() {
  console.log('\n📝 Available commit types:');
  Object.entries(commitTypes).forEach(([type, description]) => {
    console.log(`  ${type.padEnd(10)} - ${description}`);
  });
  console.log('');
}

function displayScopes() {
  console.log('\n🎯 Suggested scopes:');
  console.log(`  ${scopes.join(', ')}`);
  console.log('  (or leave empty for no scope)\n');
}

async function main() {
  console.log('🚀 Conventional Commit Helper');
  console.log('===============================');
  
  displayTypes();
  
  const type = await question('Select commit type: ');
  if (!commitTypes[type]) {
    console.log('❌ Invalid commit type. Please use one of the available types.');
    process.exit(1);
  }
  
  displayScopes();
  const scope = await question('Enter scope (optional): ');
  
  const description = await question('Enter commit description: ');
  if (!description.trim()) {
    console.log('❌ Commit description is required.');
    process.exit(1);
  }
  
  const body = await question('Enter commit body (optional, press Enter to skip): ');
  
  const isBreaking = await question('Is this a breaking change? (y/N): ');
  const breaking = isBreaking.toLowerCase() === 'y' || isBreaking.toLowerCase() === 'yes';
  
  let footer = '';
  if (breaking) {
    footer = await question('Describe the breaking change: ');
  }
  
  const issueNumber = await question('Related issue number (optional, e.g., 123): ');
  
  // Build commit message
  let commitMessage = type;
  if (scope) {
    commitMessage += `(${scope})`;
  }
  if (breaking) {
    commitMessage += '!';
  }
  commitMessage += `: ${description}`;
  
  if (body) {
    commitMessage += `\n\n${body}`;
  }
  
  if (breaking && footer) {
    commitMessage += `\n\nBREAKING CHANGE: ${footer}`;
  }
  
  if (issueNumber) {
    commitMessage += `\n\nCloses #${issueNumber}`;
  }
  
  console.log('\n📋 Generated commit message:');
  console.log('================================');
  console.log(commitMessage);
  console.log('================================\n');
  
  const confirm = await question('Commit with this message? (Y/n): ');
  if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
    console.log('❌ Commit cancelled.');
    process.exit(0);
  }
  
  try {
    // Stage all changes
    execSync('git add .', { stdio: 'inherit' });
    
    // Create commit
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    
    console.log('✅ Commit created successfully!');
    
    // Show recent commits
    console.log('\n📜 Recent commits:');
    execSync('git log --oneline -5', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Error creating commit:', error.message);
    process.exit(1);
  }
  
  rl.close();
}

main().catch(console.error);