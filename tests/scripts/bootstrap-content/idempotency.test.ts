import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = resolve(fileURLToPath(import.meta.url), '..')
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..')

const BOOTSTRAP_OUTPUT_PATHS = ['src/content/', 'src/lib/content/manifest.ts']

function gitDiffStat(): string {
  return execSync(`git diff --stat ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, {
    cwd: REPO_ROOT,
  })
    .toString()
    .trim()
}

function gitResetBootstrapOutput(): void {
  execSync(`git checkout -- ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, { cwd: REPO_ROOT })
}

describe('bootstrap idempotency', () => {
  beforeAll(() => {
    const dirty = execSync(`git status --porcelain ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, {
      cwd: REPO_ROOT,
    })
      .toString()
      .trim()
    if (dirty !== '') {
      throw new Error(
        `bootstrap idempotency test requires a clean tree; aborting.\n${dirty}\n` +
          `Run 'git checkout -- ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}' or commit your changes first.`,
      )
    }
  }, 30_000)

  afterAll(() => {
    // Protective: if the test failed mid-run and left dirty state, reset.
    gitResetBootstrapOutput()
  })

  it('running bootstrap on a clean tree leaves the tree diff-empty', () => {
    execSync('CONTENT_BOOTSTRAP=1 npm run bootstrap', { cwd: REPO_ROOT, stdio: 'pipe' })
    const diff = gitDiffStat()
    expect(diff).toBe('')
  }, 120_000)
})
