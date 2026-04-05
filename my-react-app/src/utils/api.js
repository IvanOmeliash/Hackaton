import { generateMockResponse } from './mockData';

export async function callApi(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Помилка сервера: ${response.status}`);
    }

    const data = await response.json();

    if (!data.status || data.status !== 'success' || !data.data || !data.data.metrics || !data.data.trajectory) {
      throw new Error('Невірний формат відповіді від сервера');
    }

    return data;
  } catch (error) {
    console.warn('API не доступний, використовую mock дані:', error.message);
    await new Promise((r) => setTimeout(r, 2000));
    return generateMockResponse();
  }
}
