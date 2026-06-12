import api from './api';

export const getCalendarPosts = async (filters = {}) => {
  const response = await api.get('/calendar', {
    params: {
      status: filters.status?.length ? filters.status : undefined,
      author: filters.author?.length ? filters.author : undefined,
      keywordCategory: filters.keywordCategory?.length ? filters.keywordCategory : undefined,
    },
  });

  return response.data.data || [];
};

export const reschedulePost = async (id, publishDate) => {
  const response = await api.patch(`/calendar/${id}/reschedule`, { publishDate });
  return response.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.patch(`/calendar/${id}/status`, { status });
  return response.data;
};

export const getFilters = async () => {
  const response = await api.get('/calendar/filters');
  return response.data.data || {};
};

export default {
  getCalendarPosts,
  reschedulePost,
  updateStatus,
  getFilters,
};
