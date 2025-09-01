"use client"; // ensure this page is client-side

import { Suspense } from "react";
import ContactContent from "./contact-content";

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Loading contact page...</div>}>
      <ContactContent />
    </Suspense>
  );
}
