module.exports = {
  events: ["opened"],
  run: async ({ github, context }) => {
    const pr = context.payload.pull_request;

    await github.rest.issues.addAssignees({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      assignees: [pr.user.login]
    });
  }
};