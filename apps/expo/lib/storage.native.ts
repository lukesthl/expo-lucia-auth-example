import * as SecureStore from "expo-secure-store";

async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}

export default { deleteItem, getItem, setItem };
