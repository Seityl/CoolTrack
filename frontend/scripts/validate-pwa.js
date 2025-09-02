const fs = require('fs');

console.log('🔍 Cool Track PWA Validation\n');

// Check required files
const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/offline.html'
];

let filesValid = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    filesValid = false;
  }
});

// Validate manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  console.log('✅ Manifest.json is valid JSON');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Icons: ${manifest.icons ? manifest.icons.length : 0} defined`);
} catch (err) {
  console.log(`❌ Invalid manifest.json: ${err.message}`);
  filesValid = false;
}

console.log(filesValid ? '\n🎉 PWA setup looks good!' : '\n⚠️  Please fix the issues above');
