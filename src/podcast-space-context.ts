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

/** The shape of a Staffbase backend id: 24 hex digits. */
const ID = "[0-9a-f]{24}";

/**
 * Where the currently open page's own id sits in the editor's URL.
 *
 * Confirmed against a live tenant (2026-08-18, via `scripts/browser.mjs`):
 * this widget's own config dialog is only ever opened from the **classic**
 * editor, at `/admin/plugin/page/:id` — the Content Designer route
 * documented in `docs/superpowers/specs/2026-07-31-table-translation-design.md`
 * (`/studio/content/page/:id/edit`) redirects straight to it
 * (`?isClassic=true`) for this branch. Both patterns are kept, plus a bare
 * `/pages/:id` fallback, since which editor a given tenant/branch uses is
 * not this file's to assume — if none match, `readCurrentPageId` answers
 * `null` and the caller treats the space as unknown rather than guessing.
 */
const PAGE_ID_IN_PATH = [
  new RegExp(`/admin/plugin/page/(${ID})(?:/|$)`, "i"),
  new RegExp(`/content/page/(${ID})(?:/|$)`, "i"),
  new RegExp(`/content/pages/(${ID})(?:/|$)`, "i"),
  new RegExp(`/pages/(${ID})(?:/|$)`, "i"),
];

/**
 * The id of the page currently open in the editor, read from the browser's
 * own URL — there is no widget-SDK API for this (the config dialog is not a
 * mounted block with a `WidgetApi`, it is the host's own editor chrome).
 */
export function readCurrentPageId(): string | null {
  const { pathname } = window.location;
  for (const pattern of PAGE_ID_IN_PATH) {
    const match = pathname.match(pattern);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

interface InstallationSpaceResponse {
  spaceID?: unknown;
}

/**
 * The Space the page currently open in the editor lives in, or `null` if it
 * cannot be determined (URL didn't match, request failed, or the field was
 * missing) — never rejects, so a caller can treat "unknown" the same way as
 * "no restriction applies" instead of having to guard a thrown error.
 */
export async function fetchCurrentSpaceId(): Promise<string | null> {
  const pageId = readCurrentPageId();
  if (!pageId) return null;

  try {
    const response = await fetch(`/api/installations/${pageId}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as InstallationSpaceResponse;
    return typeof body.spaceID === "string" ? body.spaceID : null;
  } catch {
    return null;
  }
}
