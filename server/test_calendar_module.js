const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const {
  normalizeStatus,
  buildCalendarFilters,
  getScheduleStatusFromBlogStatus,
  syncScheduleWithBlogState,
} = require('./controllers/calendarController');

test('normalizeStatus maps canonical values and legacy aliases', () => {
  assert.equal(normalizeStatus('draft'), 'Draft');
  assert.equal(normalizeStatus('Scheduled'), 'Scheduled');
  assert.equal(normalizeStatus('published'), 'Published');
  assert.equal(normalizeStatus('Archived'), 'Archived');
  assert.equal(normalizeStatus('approved'), 'Draft');
});

test('buildCalendarFilters returns company and multi-select query filters', () => {
  const filters = buildCalendarFilters({ companyId: 'company-1' }, {
    status: ['Scheduled', 'Published'],
    keywordCategory: ['SEO', 'Growth'],
    author: ['Ada']
  });

  assert.equal(filters.companyId, 'company-1');
  assert.deepEqual(filters.status, { $in: ['Scheduled', 'Published'] });
  assert.deepEqual(filters.keywordCategory, { $in: ['SEO', 'Growth'] });
  assert.equal(filters.author.$in.length, 1);
});

test('getScheduleStatusFromBlogStatus maps calendar states to scheduler states', () => {
  assert.equal(getScheduleStatusFromBlogStatus('Scheduled'), 'scheduled');
  assert.equal(getScheduleStatusFromBlogStatus('Published'), 'published');
  assert.equal(getScheduleStatusFromBlogStatus('Draft'), 'cancelled');
  assert.equal(getScheduleStatusFromBlogStatus('Archived'), 'cancelled');
});

test('syncScheduleWithBlogState updates existing scheduler records for the same blog', async () => {
  const updateMany = mock.fn(async () => ({ acknowledged: true }));
  const Schedule = { updateMany };

  await syncScheduleWithBlogState({
    ScheduleModel: Schedule,
    blog: {
      _id: 'blog-123',
      companyId: 'company-123',
      status: 'Scheduled',
      publishDate: '2026-06-10T12:00:00.000Z',
    },
  });

  assert.equal(updateMany.mock.calls.length, 1);
  assert.deepEqual(updateMany.mock.calls[0].arguments[0], {
    companyId: 'company-123',
    blogId: 'blog-123',
  });
  assert.deepEqual(updateMany.mock.calls[0].arguments[1], {
    $set: {
      scheduledDate: new Date('2026-06-10T12:00:00.000Z'),
      status: 'scheduled',
    },
  });
});
