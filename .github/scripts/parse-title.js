module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;
  let body = pr.body || "";

  const match = pr.title.match(/\[(\d+)\]/);
  if (!match)
    return;

  const issueId = match[1];
  const link = `https://redmine.asuni.net/issues/${issueId}`;

  if (!body.includes(link))
    body = `${body}\n\n[Redmine #${issueId}](${link})`;

  await github.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
    body: body
  });
};