import type { RegistryMeta } from "@kubeasy/api-schemas/registry";

const REGISTRY_URL =
  import.meta.env.VITE_REGISTRY_URL ?? "https://registry.kubeasy.dev";

export async function getRegistryMeta(): Promise<RegistryMeta> {
  const res = await fetch(`${REGISTRY_URL}/meta`);
  if (!res.ok) throw new Error(`Registry /meta returned ${res.status}`);
  return res.json() as Promise<RegistryMeta>;
}
