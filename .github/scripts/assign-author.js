module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;

  await github.rest.pulls.addAssignee({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
    assignees: [pr.user.login]
  });
};