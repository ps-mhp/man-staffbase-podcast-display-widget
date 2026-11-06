/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Suspense, useRef, useState } from "react";

import { documentLocales } from "./podcast-content";
import { pickPodcastAccessHelpText } from "./podcast-access-help-translations";

const LazyPodcastAccessHelpModal = React.lazy(() =>
  import("./podcast-access-help-modal").then((module) => ({ default: module.PodcastAccessHelpModal })),
);

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "6px",
  padding: 0,
  border: "none",
  background: "none",
  font: "inherit",
  fontSize: "12px",
  color: "#3b82f6",
  textDecoration: "underline",
  cursor: "pointer",
};

/**
 * The "podcast missing?" link next to the podcast picker, and the modal it
 * opens.
 *
 * Exists because the picker itself now silently drops podcasts the current
 * author's session cannot retrieve any episode for (see `podcast-catalog.ts`)
 * — a correct but, on its own, unexplained gap in the list. This is that
 * explanation, in the author's own language rather than the widget's German
 * default (see `podcast-access-help-translations.ts`).
 *
 * The link sits in the Studio's form, next to a native select, and keeps its
 * inline style like the picker beside it; the modal is `@shared/ui`.
 */
export function PodcastAccessHelp(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const linkRef = useRef<HTMLButtonElement>(null);
  const text = pickPodcastAccessHelpText(documentLocales());

  return (
    <>
      <button
        ref={linkRef}
        type="button"
        style={linkStyle}
        onClick={() => setOpen(true)}
        data-testid="podcast-access-help-link"
      >
        {text.linkText}
      </button>
      {open && (
        <Suspense fallback={null}>
          <LazyPodcastAccessHelpModal text={text} within={linkRef.current} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
