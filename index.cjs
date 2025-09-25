const { execSync } = require("child_process");

// Your actual file
const filename = "index.cjs";

// Dates from 21st Sept to 29th Sept 2025
const commitDates = [
  "2025-09-21T11:00:00",
  "2025-09-22T11:00:00",
  "2025-09-23T11:00:00",
  "2025-09-24T11:00:00",
  "2025-09-25T11:00:00",
  "2025-09-26T11:00:00",
  "2025-09-27T11:00:00",
  "2025-09-28T11:00:00",
  "2025-09-29T11:00:00",
];

commitDates.forEach((commitDate) => {
  // Append something unique so each commit is different
  execSync(`echo "Commit on ${commitDate}" >> ${filename}`);

  // Stage the file
  execSync(`git add ${filename}`, { stdio: "inherit" });

  // Commit message
  const commitCommand = `git commit -m "Commit on ${commitDate}"`;

  // Env variables for commit date
  const env = {
    ...process.env,
    GIT_AUTHOR_DATE: commitDate,
    GIT_COMMITTER_DATE: commitDate,
  };

  // Commit
  execSync(commitCommand, { stdio: "inherit", env });

  console.log("✅ Commit created with date:", commitDate);
});

// Push all commits at once
execSync(`git push`, { stdio: "inherit" });

console.log("🚀 All commits pushed!");
Commit on 2025-09-21T11:00:00
Commit on 2025-09-22T11:00:00
Commit on 2025-09-23T11:00:00
Commit on 2025-09-24T11:00:00
Commit on 2025-09-25T11:00:00
