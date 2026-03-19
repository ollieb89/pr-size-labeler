import * as core from '@actions/core';
import * as github from '@actions/github';
import { minimatch } from 'minimatch';

interface SizeConfig {
  label: string;
  max: number;
  color: string;
  description: string;
}

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true });
    const labelPrefix = core.getInput('label-prefix');
    const excludePatterns = core.getInput('exclude-patterns')
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const sizes: SizeConfig[] = [
      { label: `${labelPrefix}XS`, max: parseInt(core.getInput('xs-max')), color: '3CBF00', description: 'Extra small PR (trivial change)' },
      { label: `${labelPrefix}S`, max: parseInt(core.getInput('s-max')), color: '5D9801', description: 'Small PR (quick review)' },
      { label: `${labelPrefix}M`, max: parseInt(core.getInput('m-max')), color: 'F9D0C4', description: 'Medium PR (moderate review)' },
      { label: `${labelPrefix}L`, max: parseInt(core.getInput('l-max')), color: 'E99695', description: 'Large PR (thorough review needed)' },
      { label: `${labelPrefix}XL`, max: Infinity, color: 'D93F0B', description: 'Extra large PR (consider splitting)' },
    ];

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      core.info('Not a pull request event, skipping');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    // Get PR files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    // Calculate size excluding patterns
    let totalChanges = 0;
    let excludedFiles = 0;

    for (const file of files) {
      const shouldExclude = excludePatterns.some(pattern => 
        minimatch(file.filename, pattern, { matchBase: true })
      );

      if (shouldExclude) {
        excludedFiles++;
        continue;
      }

      totalChanges += file.additions + file.deletions;
    }

    core.info(`Total changes: ${totalChanges} (${excludedFiles} files excluded)`);

    // Determine size
    const size = sizes.find(s => totalChanges <= s.max) || sizes[sizes.length - 1];
    core.info(`PR size: ${size.label} (${totalChanges} lines)`);

    // Ensure label exists
    try {
      await octokit.rest.issues.getLabel({ owner, repo, name: size.label });
    } catch {
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: size.label,
        color: size.color,
        description: size.description,
      });
    }

    // Remove old size labels
    const { data: currentLabels } = await octokit.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number: prNumber,
    });

    for (const label of currentLabels) {
      if (label.name.startsWith(labelPrefix) && label.name !== size.label) {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: prNumber,
          name: label.name,
        });
      }
    }

    // Add new label
    const hasLabel = currentLabels.some(l => l.name === size.label);
    if (!hasLabel) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: [size.label],
      });
    }

    // Set outputs
    core.setOutput('size', size.label);
    core.setOutput('total-changes', totalChanges.toString());
    core.setOutput('files-changed', (files.length - excludedFiles).toString());

    // Add summary
    await core.summary
      .addHeading('PR Size', 3)
      .addTable([
        [{ data: 'Size', header: true }, { data: 'Lines Changed', header: true }, { data: 'Files', header: true }],
        [size.label, totalChanges.toString(), (files.length - excludedFiles).toString()],
      ])
      .write();

    if (size.label === `${labelPrefix}XL`) {
      core.warning('This PR is extra large. Consider splitting it into smaller, focused PRs for easier review.');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
