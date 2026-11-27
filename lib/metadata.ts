import type { Metadata } from "next";

export interface PageMetadataInput {
  title: string;
  description: string;
}

/** Build consistent page metadata with title, description, and OpenGraph tags. */
export function createPageMetadata({
  title,
  description,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} | UniManage`,
      description,
      type: "website",
      siteName: "UniManage",
    },
  };
}
