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
    for (const match of matches) {
      const issueId = match[1];
      const link = `https://redmine.asuni.net/issues/${issueId}`;

      if (body.includes(link))
        continue;

      linksToAdd.push(`[Redmine #${issueId}](${link})`);
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