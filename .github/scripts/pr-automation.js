module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;
  const prNumber = pr.number;
  const author = pr.user.login;
  const title = pr.title;
  let body = pr.body || "";

  await github.rest.issues.addAssignees({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    assignees: [author]
  });

  const match = title.match(/\[(\d+)\]/);

  if (match) {
    const issueId = match[1];
    const link = `https://redmine.asuni.net/issues/${issueId}`;

    if (!body.includes(link)) {
      body = `${body}\n\n[Redmine #${issueId}](${link})`;
    }

    await github.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
      body: body
    });
  }
};