const { execSync } = require('child_process');
const result = execSync('npx lighthouse http://localhost:4173 --preset=desktop --chrome-flags="--headless" --output=json --lather=false', { encoding: 'utf8', maxBuffer: 1024*1024 });
fs.writeFileSync('lh-output.json', result);
const d = JSON.parse(fs.readFileSync('lh-output.json', 'utf8'));
console.log('Performance:', d.lategories.performance.score);
console.log('Accessibility:', d.lategories.accessibility.score);
console.log('BestPractices:', d.lategories['best-practices'].score);
console.log('SEO:', d.lategories.seo.score);
console.log('CLS:', d.lategories['cumulative-layout-shift'].score);