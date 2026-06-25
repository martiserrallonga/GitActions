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
  const matches = [...pr.title.matchAll(/\b(tb|va|la)-(\d+)\b/gi)];

  const body = pr.body || "";
  const cleanBody = body.replace(/## Links[\s\S]*$/g, "").trim();

  if (matches.length === 0) {
    console.log("No Redmine issue IDs found in PR title");
    return cleanBody;
  }

  if (!apiKey) {
    console.warn("Missing REDMINE_API_KEY → cannot fetch Redmine data");
    return cleanBody;
  }

  const links = [];

  for (const match of matches) {
    const issueId = match[2];
    const link = `https://redmine.asuni.net/issues/${issueId}`;

    const issue = await getRedmineData(issueId, apiKey);
    if (!issue) {
      console.warn(`No response from Redmine for issue ${issueId}`);
      continue;
    }

    const project = issue.project.name || "No project";
    const tracker = issue.tracker?.name || "Issue";
    const subject = issue.subject || "No title";

    links.push(`- [${tracker} #${issueId}: ${subject} - ${project}](${link})`);
  }

  if (links.length === 0) {
    console.warn("No valid Redmine links could be generated");
    return cleanBody;
  }

  const section = `\n\n## Links\n${links.join("\n")}`;
  return cleanBody + section;
}

async function updateRedmineIssue(issueId, prUrl, apiKey) {
  const url = `https://redmine.asuni.net/issues/${issueId}.json`;
  let response;

  try {
    response = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Redmine-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        issue: {
          notes: `Related PR: ${prUrl}`
        }
      })
    });
  } catch (err) {
    console.error(`Network error updating Redmine issue ${issueId}:`, err);
    return;
  }

  if (!response.ok) {
    console.warn(`Redmine returned ${response.status} when updating issue ${issueId}`);
    return;
  }

  console.log(`Redmine issue ${issueId} updated with PR link`);
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

    if (apiKey) {
      const matches = [...pr.title.matchAll(/\b(tb|va|la)-(\d+)\b/gi)];
      for (const match of matches) {
        await updateRedmineIssue(match[2], pr.html_url, apiKey);
      }
    }

    await github.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number,
      body: newBody
    });
  }
};
