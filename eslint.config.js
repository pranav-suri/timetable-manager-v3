//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple', // Allows T[]
        },
      ],
      'import/order': 'warn'
    },
  },
]
