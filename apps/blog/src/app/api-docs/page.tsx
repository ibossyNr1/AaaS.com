import type { Metadata } from "next";
import { ApiDocsClient } from "./api-docs-client";

export const metadata: Metadata = {
  title: "API Documentation — AaaS Knowledge Index",
  description:
    "Interactive API reference for the AaaS Knowledge Index. Browse endpoints, view schemas, and test requests.",
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
