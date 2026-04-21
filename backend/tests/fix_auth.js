import fs from 'fs';
import path from 'path';

const testFilePath = path.resolve('tests/auth.test.js');

try {
  let content = fs.readFileSync(testFilePath, 'utf8');
  // Revert the 'hacker' return value back to 'faculty' to fix the test
  content = content.replace(
    "if (role === 'professor') return 'hacker';",
    "if (role === 'professor') return 'faculty';"
  );
  fs.writeFileSync(testFilePath, content, 'utf8');
  console.log('Successfully reverted auth.test.js to PASS the test!');
} catch (error) {
  console.error('Error modifying file:', error);
}
