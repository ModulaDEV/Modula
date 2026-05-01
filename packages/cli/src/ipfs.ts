/**
 * Upload a Modula manifest JSON to IPFS via nft.storage.
 *
 * Returns the raw CIDv1 string so callers can build `ipfs://<cid>`.
 * Requires NFT_STORAGE_KEY env var (free API key from nft.storage).
 */

export interface ManifestInput {
  name:        string;
  runtimeUrl:  string;
  modelType:   string;
  description?: string;
  tags?:        string[];
}

export async function uploadToIPFS(manifest: ManifestInput): Promise<string> {
  const key = process.env.NFT_STORAGE_KEY;
  if (!key) throw new Error("NFT_STORAGE_KEY env var is required");

  const payload = {
    name:        manifest.name,
    description: manifest.description ?? `Modula model — ${manifest.name}`,
    modelType:   manifest.modelType,
    tags:        manifest.tags ?? [],
    runtime: {
      url: manifest.runtimeUrl,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const form = new FormData();
  form.append("file", blob, "manifest.json");

  const res = await fetch("https://api.nft.storage/upload", {
    method:  "POST",
    headers: { authorization: `Bearer ${key}` },
    body:    form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`nft.storage upload failed ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { value?: { cid?: string }; cid?: string };
  const cid  = json?.value?.cid ?? (json as { cid?: string })?.cid;
  if (!cid) throw new Error("nft.storage response missing CID");
  return cid;
}
