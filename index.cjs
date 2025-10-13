const { execSync } = require("child_process");

// Your actual file
const filename = "index.cjs";

// Dates for commits
const commitDates = [
  "2025-10-11T11:00:00",
  "2025-10-12T11:00:00",
  "2025-10-13T11:00:00",
  "2025-10-14T11:00:00",
  "2025-10-15T11:00:00",
  "2025-10-16T11:00:00",
  "2025-10-17T11:00:00",
  "2025-10-18T11:00:00",
  "2025-10-19T11:00:00",
  "2025-10-20T11:00:00",
  "2025-10-21T11:00:00",
];

commitDates.forEach((commitDate) => {
  // Append something unique so git detects change
  execSync(`echo "Commit on ${commitDate}" >> ${filename}`);

  // Stage the file
  execSync(`git add ${filename}`, { stdio: "inherit" });

  // Commit message
  const commitCommand = `git commit -m "Commit on ${commitDate}"`;

  // Set environment variables for commit date
  const env = {
    ...process.env,
    GIT_AUTHOR_DATE: commitDate,
    GIT_COMMITTER_DATE: commitDate,
  };

  // Commit
  execSync(commitCommand, { stdio: "inherit", env });

  console.log("✅ Commit created for date:", commitDate);
});

// Push all commits at once
execSync(`git push`, { stdio: "inherit" });

console.log("🚀 All commits pushed!");
Commit on 2025-10-11T11:00:00
Commit on 2025-10-12T11:00:00
Commit on 2025-10-13T11:00:00
