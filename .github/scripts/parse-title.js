async function getRedmineData(issueId, apiKey) {
  let response;
  try {
    const url = `https://redmine.asuni.net/issues/${issueId}.json`;
    response = await fetch(url, {
      headers: { "X-Redmine-API-Key": apiKey }
    });
  } catch (err) {
    console.error(`Network error fetching ${issueId}`, err);
    return null;
  }

  if (!response.ok) {
    console.warn(`Redmine returned ${response.status} for ${issueId}`);
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error(`Invalid JSON for ${issueId}`, err);
    return null;
  }

  return data.issue;
}

module.exports = {
  events: ["opened", "edited", "synchronize"],
  run: async ({ github, context }) => {
    const pr = context.payload.pull_request;

    if (context.payload.action === "edited" && 
      !context.payload.changes?.title)
    {
      console.log("Title has not changed. Exiting");
      return;
    }

    const matches = [...pr.title.matchAll(/\[(\d+)\]/g)];
    if (matches.length === 0)
      return;

    let body = pr.body || "";
    let linksToAdd = [];

    console.log("API KEY exists:", !!process.env.REDMINE_API_KEY);

    for (const match of matches) {  
      const issueId = match[1];
      
      const link = `https://redmine.asuni.net/issues/${issueId}`;
      if (body.includes(link))
        continue;

      const issue = await getRedmineData(issueId, process.env.REDMINE_API_KEY);
      if (!issue)
        continue;

      const tracker = issue.tracker?.name || "Issue";
      const markdown = `[${tracker} #${issueId}: ${issue.subject}](${link})`;
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