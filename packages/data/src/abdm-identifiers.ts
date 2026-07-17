const SAFE_REGISTRY_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function assertSafeRegistryId(id: string, kind: string) {
  if (!SAFE_REGISTRY_ID.test(id)) throw new Error(`ABDM ${kind} has unsafe identifier ${JSON.stringify(id)}.`);
  return id;
}
