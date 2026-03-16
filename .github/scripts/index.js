// const assignAuthor = require('./assign-author');
// const addRedmineLink = require('./parse-title');

// module.exports = async ({ github, context }) => {
//   await assignAuthor({ github, context });
//   await addRedmineLink({ github, context });
// };

const fs = require('fs');
const path = require('path');

module.exports = async ({ github, context }) => {
  const scriptsDir = __dirname;
  const files = fs.readdirSync(scriptsDir);

  for (const file of files) {
    if (file === 'index.js')
      continue;

    const script = require(path.join(scriptsDir, file));
    await script({ github, context });
  }
};