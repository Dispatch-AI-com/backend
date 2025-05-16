const { execSync } = require('child_process');
const platform = process.platform;
console.log('process.platform:', platform);

const isWin = platform === 'win32';

if (isWin || process.env.USE_TS_NODE_DEV === 'true') {
  execSync('pnpm exec ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/main.ts', { stdio: 'inherit' });
} else {
  execSync('pnpm exec nest start --watch', { stdio: 'inherit' });
}
