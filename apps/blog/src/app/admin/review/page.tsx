import type { Metadata } from "next";
import { ReviewClient } from "./review-client";

export const metadata: Metadata = {
  title: "Admin Review — AaaS Knowledge Index",
  description: "Review pending submissions and categorization suggestions.",
};

export default function AdminReviewPage() {
  return <ReviewClient />;
}
