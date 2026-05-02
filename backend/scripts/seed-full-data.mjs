import { spawn } from 'node:child_process';

const scripts = [
  'scripts/seed-and-generate-users.mjs',
  'scripts/generate-test-faculty-data.mjs',
];

const runScript = (scriptPath) =>
  new Promise((resolve, reject) => {
    const childProcess = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      shell: false,
    });

    childProcess.on('error', reject);
    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptPath} failed with exit code ${code}`));
    });
  });

const main = async () => {
  for (const scriptPath of scripts) {
    await runScript(scriptPath);
  }
};

main().catch((error) => {
  console.error('[seed-full-data] Failed to seed full test dataset');
  console.error(error);
  process.exit(1);
});
