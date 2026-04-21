import fs from 'fs';
import path from 'path';

const testFilePath = path.resolve('tests/auth.test.js');

try {
  let content = fs.readFileSync(testFilePath, 'utf8');
  // Change the 'faculty' return value to 'hacker' to break the test
  content = content.replace(
    "if (role === 'professor') return 'faculty';",
    "if (role === 'professor') return 'hacker';"
  );
  fs.writeFileSync(testFilePath, content, 'utf8');
  console.log('Successfully modified auth.test.js to FAIL the test!');
} catch (error) {
  console.error('Error modifying file:', error);
}
