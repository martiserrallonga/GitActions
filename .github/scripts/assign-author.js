module.exports = {
  events: ["opened"],
  run: async ({ github, context }) => {
    const pr = context.payload.pull_request;
    const author = pr.user.login;

    try {
      await github.rest.issues.addAssignees({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
        assignees: [author]
      });
      console.log(`Assigned '${author}' to PR #${pr.number}`);
    } catch (err) {
      console.warn(`Could not assign '${author}' to PR #${pr.number}: ${err.message}`);
    }
  }
};