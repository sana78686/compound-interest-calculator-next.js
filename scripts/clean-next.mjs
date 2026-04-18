/**
 * Remove `.next` before dev/build — fixes stale cache on Windows.
 *
 * Important: stop every `next dev` for this project first (Ctrl+C in all terminals).
 * Deleting `.next` while the dev server is still running causes missing chunks
 * (`Cannot find module './NNN.js'`), missing `routes-manifest.json`, and GET / → 500.
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
