const listElement = document.querySelector('#items-list');
const countElement = document.querySelector('#item-count');
const listMessage = document.querySelector('#list-message');
const form = document.querySelector('#item-form');
const formMessage = document.querySelector('#form-message');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const itemIdInput = document.querySelector('#item-id');
const saveButton = document.querySelector('#save-item');
const cancelButton = document.querySelector('#cancel-edit');

function setMessage(element, message, type) {
  element.textContent = message;
  element.className = `notice${type ? ` notice-${type}` : ''}`;
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
  if (!response.ok) {
    throw new Error(result?.error || '요청을 처리하지 못했습니다.');
  }
  return result;
}

function createDetail(label, value) {
  const row = document.createElement('p');
  const title = document.createElement('strong');
  title.textContent = label;
  const text = document.createElement('span');
  text.textContent = value;
  row.append(title, text);
  return row;
}

function createItemCard(item) {
  const card = document.createElement('article');
  card.className = 'item-card';

  const top = document.createElement('div');
  top.className = 'item-card-top';
  const name = document.createElement('h3');
  name.textContent = item.name;
  const status = document.createElement('span');
  status.className = `status${item.status === '반환 완료' ? ' status-returned' : ''}`;
  status.textContent = item.status;
  top.append(name, status);

  const details = document.createElement('div');
  details.className = 'item-details';
  details.append(
    createDetail('발견 장소', item.found_location),
    createDetail('보관 장소', item.storage_location)
  );
  card.append(top, details);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'button button-quiet';
  editButton.textContent = '정보 수정';
  editButton.addEventListener('click', () => beginEdit(item));
  actions.append(editButton);
  card.append(actions);
  return card;
}

async function loadItems(search = '') {
  listMessage.textContent = '';
  listElement.replaceChildren();
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  try {
    const items = await request(`/api/items${query}`);
    countElement.textContent = `${items.length}개`;
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = search
        ? '검색 결과가 없어요. 다른 물건 이름으로 검색해 보세요.'
        : '아직 등록된 분실물이 없어요. 첫 번째 분실물을 등록해 주세요.';
      listElement.append(empty);
      return;
    }
    items.forEach((item) => listElement.append(createItemCard(item)));
  } catch (error) {
    setMessage(listMessage, error.message, 'error');
  }
}

function beginEdit(item) {
  itemIdInput.value = item.id;
  form.elements.name.value = item.name;
  form.elements.found_location.value = item.found_location;
  form.elements.storage_location.value = item.storage_location;
  document.querySelector('#form-title').textContent = '분실물 정보 수정';
  saveButton.textContent = '수정 내용 저장';
  cancelButton.hidden = false;
  setMessage(formMessage, '정보를 수정한 뒤 저장해 주세요.');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.elements.name.focus({ preventScroll: true });
}

function resetForm() {
  form.reset();
  itemIdInput.value = '';
  document.querySelector('#form-title').textContent = '분실물 정보 등록';
  saveButton.textContent = '분실물 등록';
  cancelButton.hidden = true;
  setMessage(formMessage, '');
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadItems(searchInput.value.trim());
});

document.querySelector('#reset-search').addEventListener('click', () => {
  searchInput.value = '';
  loadItems();
});

cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = itemIdInput.value;
  const body = {
    name: form.elements.name.value,
    found_location: form.elements.found_location.value,
    storage_location: form.elements.storage_location.value
  };

  saveButton.disabled = true;
  try {
    await request(id ? `/api/items/${id}` : '/api/items', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });
    resetForm();
    setMessage(formMessage, id ? '분실물 정보를 수정했어요.' : '분실물을 등록했어요.', 'success');
    await loadItems(searchInput.value.trim());
  } catch (error) {
    setMessage(formMessage, error.message, 'error');
  } finally {
    saveButton.disabled = false;
  }
});

loadItems();
