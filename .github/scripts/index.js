const fs = require('fs');
const path = require('path');

module.exports = async ({ github, context }) => {
  const action = context.payload.action;

  const dir = __dirname;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === "index.js")
      continue;

    const script = require(path.join(dir, file));
    if (!script.events.includes(action))
      continue;

    await script.run({ github, context });
  }
};