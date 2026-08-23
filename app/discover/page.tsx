import type { Metadata } from "next";
import { catalogItems } from "../../data/catalog";
import { DiscoveryCatalog } from "./discovery-catalog";

export const metadata: Metadata = {
  title: "Discover",
  description: "Search accessible services, inclusive jobs, training and education opportunities across Bangladesh.",
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default function DiscoverPage() {
  return <DiscoveryCatalog items={catalogItems} />;
}
