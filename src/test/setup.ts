import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { configure } from '@testing-library/react'

// fake-indexeddb + parallel workers can be slow; avoid flaky 1s default timeouts.
configure({ asyncUtilTimeout: 6000 })
