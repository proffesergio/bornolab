/** Public showcase media only. Customer artwork never enters this library. */
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;
export const MEDIA_MAX_ASSETS = 250;
export const MEDIA_MAX_TOTAL = 128 * 1024 * 1024;
export type MediaAsset = {
  id: string; url: string; title: string; alt: string; tags: string[];
  categoryIds: string[]; serviceIds: string[]; published: boolean; archived: boolean;
  mime: string; bytes: number; width: number; height: number; createdAt: number; updatedAt: number;
};
export type MediaIndex = { assets: MediaAsset[]; audit: { actor: string; action: string; id: string; at: number }[] };
export function mediaMetadata(value: Record<string, unknown>) {
  function text(key: string, limit: number) {
    if (typeof value[key] !== "string" || (value[key] as string).length > limit) throw new Error(`Invalid ${key}.`);
    return (value[key] as string).trim();
  }
  function list(key: string) {
    if (!Array.isArray(value[key]) || value[key].length > 100 || value[key].some(v => typeof v !== "string" || v.length > 100)) throw new Error(`Invalid ${key}.`);
    return [...new Set((value[key] as string[]).map(v => v.trim()).filter(Boolean))];
  }
  const title = text("title", 160), alt = text("alt", 300);
  if (!title || !alt) throw new Error("Title and image description are required.");
  if (typeof value.published !== "boolean" || typeof value.archived !== "boolean") throw new Error("Invalid media visibility.");
  return { title, alt, tags: list("tags"), categoryIds: list("categoryIds"), serviceIds: list("serviceIds"), published: value.published, archived: value.archived };
}
export function mediaUsage(asset: MediaAsset, categories: {id:string;image?:string}[], services: {id:string;image:string;gallery?:string[]}[], orders:{id:string;selectedDesign?:{image:string};service:{image:string;gallery?:string[]}}[] = []) {
  return [...categories.filter(c => c.image === asset.url).map(c => `Category: ${c.id}`), ...services.filter(s => s.image === asset.url || s.gallery?.includes(asset.url)).map(s => `Service: ${s.id}`),...orders.filter(o=>o.selectedDesign?.image===asset.url||o.service.image===asset.url||o.service.gallery?.includes(asset.url)).map(o=>`Order: ${o.id}`)];
}
