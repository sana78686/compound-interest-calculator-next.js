/**
 * Remove `.next` before build — fixes Windows/Git Bash ENOENT / "Cannot find module for page"
 * when the cache is stale or partially written.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = path.join(root, '.next')

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true })
  console.log('Removed .next')
}
