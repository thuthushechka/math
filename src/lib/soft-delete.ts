export const notDeleted = { deletedAt: null };

export function softDeleteData() {
  return { deletedAt: new Date() };
}

export function restoreData() {
  return { deletedAt: null };
}
