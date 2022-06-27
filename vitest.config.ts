import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: 'dotenv/config', // load variables form .env file
    testTimeout: 120 * 1000
  }
})
