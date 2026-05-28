/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'improve',
        'refactor',
        'test',
        'docs',
        'chore',
        'ci',
        'perf',
        'style',
        'revert',
      ],
    ],
    'subject-case': [1, 'never', ['start-case', 'pascal-case']],
    'body-max-line-length': [1, 'always', 120],
  },
};
