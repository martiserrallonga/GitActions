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

async function generateRedmineLinks(pr, apiKey) {
  const matches = [...pr.title.matchAll(/\[(\d+)\]/g)];

  const body = pr.body || "";
  const cleanBody = body.replace(/## Links[\s\S]*$/g, "").trim();

  if (matches.length === 0) {
    console.log("No Redmine issue IDs found in PR title");
    return cleanBody;
  }

  if (!apiKey) {
    console.error("Missing REDMINE_API_KEY → cannot fetch Redmine data");
    return cleanBody;
  }

  const links = [];

  for (const match of matches) {
    const issueId = match[1];
    const link = `https://redmine.asuni.net/issues/${issueId}`;

    const data = await getRedmineData(issueId, apiKey);
    if (!data) {
      console.warn(`No response from Redmine for issue ${issueId}`);
      continue;
    }

    if (!data.issue) {
      console.warn(`Invalid Redmine data for issue ${issueId}: missing 'issue' field`);
      continue;
    }

    const issue = data.issue;
    const tracker = issue.tracker?.name || "Issue";
    let subject = issue.subject;
    if (!subject) {
      console.warn(`Issue ${issueId} has no subject`);
      subject = "No title";
    }

    links.push(`- [${tracker} #${issueId}: ${subject}](${link})`);
  }

  if (links.length === 0) {
    console.log("No valid Redmine links could be generated");
    return cleanBody;
  }

  const section = `\n\n## Links\n${links.join("\n")}`;
  return cleanBody + section;
}

module.exports = {
  events: ["opened", "edited"],
  run: async ({ github, context }) => {
    const pr = context.payload.pull_request;

    if (context.payload.action === "edited" && 
        !context.payload.changes?.title) {
      console.log("Title has not changed. Exiting");
      return;
    }

    const apiKey = process.env.REDMINE_API_KEY;
    const newBody = await generateRedmineLinks(pr, apiKey);

    await github.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      body: newBody
    });
  }
};
