import type { Metadata } from "next";
import { catalogItems } from "../../data/catalog";
import { listPublishedCatalog } from "../../db/catalog-repository";
import { DiscoveryCatalog } from "./discovery-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover",
  description: "Search accessible services, inclusive jobs, training and education opportunities across Bangladesh.",
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default async function DiscoverPage() {
  let items = catalogItems;
  try {
    items = await listPublishedCatalog();
  } catch {
    // The checked-in catalogue keeps build-time and first-migration rendering useful.
  }
  return <DiscoveryCatalog items={items} />;
}
