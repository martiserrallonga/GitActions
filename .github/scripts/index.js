const fs = require('fs');
const path = require('path');

module.exports = async ({ github, context }) => {
  const action = context.payload.action;

  const dir = __dirname;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === "index.js" || !file.endsWith(".js"))
      continue;

    const script = require(path.join(dir, file));
    if (!Array.isArray(script.events) || typeof script.run !== "function") {
      console.warn(`Skipping '${file}': missing 'events' array or 'run' function`);
      continue;
    }

    if (!script.events.includes(action))
      continue;

    try {
      await script.run({ github, context });
    } catch (err) {
      console.error(`Script '${file}' failed: ${err.message}`);
    }
  }
};