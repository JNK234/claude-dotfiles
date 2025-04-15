const { execSync } = require('child_process');
const path = require('path');

// Run Tailwind CSS build process
console.log('Building Tailwind CSS...');
try {
  execSync('npx tailwindcss@3.4.1 -i ./src/index.css -o ./src/styles/tailwind.css', { stdio: 'inherit' });
  console.log('Tailwind CSS build completed successfully!');
} catch (error) {
  console.error('Error building Tailwind CSS:', error);
  process.exit(1);
} 