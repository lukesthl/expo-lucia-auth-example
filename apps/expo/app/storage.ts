async function getItem(key: string): Promise<string | null> {
  await Promise.resolve();
  return localStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  await Promise.resolve();
  localStorage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  await Promise.resolve();
  localStorage.removeItem(key);
}

export default { deleteItem, getItem, setItem };
