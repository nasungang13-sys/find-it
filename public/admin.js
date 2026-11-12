const list = document.querySelector('#admin-list');
const message = document.querySelector('#admin-message');
const count = document.querySelector('#admin-item-count');

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = `notice${type ? ` notice-${type}` : ''}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const result = response.status === 204 ? null : await response.json();
  if (response.status === 401) {
    window.location.assign('/admin/login');
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!response.ok) {
    throw new Error(result?.error || '요청을 처리하지 못했습니다.');
  }
  return result;
}

function createField(labelText, value, name) {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.name = name;
  input.value = value;
  input.maxLength = 100;
  input.required = true;
  label.append(input);
  return label;
}

function createStatusField(value) {
  const label = document.createElement('label');
  label.textContent = '반환 상태';
  const select = document.createElement('select');
  select.name = 'status';
  for (const optionText of ['보관 중', '반환 완료']) {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    option.selected = optionText === value;
    select.append(option);
  }
  label.append(select);
  return label;
}

function createItem(item) {
  const card = document.createElement('article');
  card.className = 'admin-card';
  const form = document.createElement('form');
  form.className = 'admin-form';
  form.append(
    createField('물건 이름', item.name, 'name'),
    createField('발견 장소', item.found_location, 'found_location'),
    createField('보관 장소', item.storage_location, 'storage_location'),
    createStatusField(item.status)
  );
  const saveButton = document.createElement('button');
  saveButton.className = 'button button-primary';
  saveButton.type = 'submit';
  saveButton.textContent = '저장';
  form.append(saveButton);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    try {
      await request(`/api/admin/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.elements.name.value,
          found_location: form.elements.found_location.value,
          storage_location: form.elements.storage_location.value,
          status: form.elements.status.value
        })
      });
      showMessage('분실물 정보를 수정했어요.', 'success');
      await loadItems();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  const actions = document.createElement('div');
  actions.className = 'admin-actions';
  const deleteButton = document.createElement('button');
  deleteButton.className = 'button button-danger';
  deleteButton.type = 'button';
  deleteButton.textContent = '삭제';
  deleteButton.addEventListener('click', async () => {
    if (!window.confirm(`"${item.name}" 분실물을 삭제할까요?`)) {
      return;
    }
    deleteButton.disabled = true;
    try {
      await request(`/api/admin/items/${item.id}`, { method: 'DELETE' });
      showMessage('분실물을 삭제했어요.', 'success');
      await loadItems();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      deleteButton.disabled = false;
    }
  });
  actions.append(deleteButton);
  card.append(form, actions);
  return card;
}

async function loadItems() {
  showMessage('');
  list.replaceChildren();
  try {
    const items = await request('/api/items');
    count.textContent = `${items.length}개`;
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = '등록된 분실물이 없어요.';
      list.append(empty);
      return;
    }
    items.forEach((item) => list.append(createItem(item)));
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  try {
    await request('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin/login');
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

loadItems();
