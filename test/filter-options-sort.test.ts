import test from 'node:test';
import assert from 'node:assert/strict';

import { sortFilterOptions } from '@/app/api/works/filter-options/sort-filter-options';

test('sortFilterOptions orders items by sortOrder before localized label', () => {
  const items = [
    { label: '北京', value: 'BJ', sortOrder: 30 },
    { label: '安徽', value: 'AH', sortOrder: 10 },
    { label: '浙江', value: 'ZJ', sortOrder: 20 },
  ];

  const sorted = sortFilterOptions(items, 'zh-CN');

  assert.deepEqual(
    sorted.map((item) => item.value),
    ['AH', 'ZJ', 'BJ']
  );
});
