// Optional: configure or set up a testing framework before each test
// if you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import React from 'react'

jest.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: (_, iconName) => {
        const MockIcon = (props) =>
          React.createElement('svg', {
            'data-testid': `icon-${String(iconName)}`,
            ...props,
          })
        MockIcon.displayName = `Mock${String(iconName)}`
        return MockIcon
      },
    }
  )
})
