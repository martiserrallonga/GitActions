module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;

  await github.rest.issues.addAssignee({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pr.number,
    assignees: [pr.user.login]
  });
};