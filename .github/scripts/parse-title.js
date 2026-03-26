const fetch = require("node-fetch");

async function getRedmineIssue(issueId, apiKey) {
  const url = `https://redmine.asuni.net/issues/${issueId}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Redmine-API-Key": apiKey
      }
    });

    if (!response.ok) {
      console.warn(`Error fetching issue ${issueId}`);
      return null;
    }

    const data = await response.json();
    return data.issue;

  } catch (err) {
    console.error(`Failed to fetch issue ${issueId}`, err);
    return null;
  }
}

module.exports = {
  events: ["opened", "edited"],
  run: async ({ github, context }) => {
    const pr = context.payload.pull_request;

    if (context.payload.action === "edited" &&
        !context.payload.changes?.title)
      return;

    const matches = [...pr.title.matchAll(/\[(\d+)\]/g)];
    if (matches.length === 0)
      return;

    let body = pr.body || "";
    let linksToAdd = [];

    console.log("API KEY exists:", !!process.env.REDMINE_API_KEY);

    for (const match of matches) {
      const issueId = match[1];
      const issue = await getRedmineIssue(issueId, process.env.REDMINE_API_KEY);

      if (!issue)
        continue;

      const link = `https://redmine.asuni.net/issues/${issueId}`;
      const title = issue.subject;

      const markdown = `[${title}](${link})`;

      if (body.includes(link))
        continue;

      linksToAdd.push(markdown);
    }

    if (linksToAdd.length === 0)
      return;

    body = `${body}\n\n${linksToAdd.join("\n")}`;

    await github.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      body
    });
  }
};