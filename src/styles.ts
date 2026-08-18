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

import styles from "./styles.scss";

/** Id of the single style element, which is also how it is recognised again. */
export const STYLE_ELEMENT_ID = "podcast-display-widget-styles";

/**
 * Id every rendered widget root carries (see `PodcastView`), so every
 * selector in `styles.scss` can be written as `#${ROOT_ID} .podcast-display__x`.
 *
 * A host page frequently loads its own, more specific or later-loaded CSS
 * (e.g. `button` resets, a design-system's own `.button` class) that would
 * otherwise win over a plain class selector by load order or specificity —
 * exactly what happened before this was added. An id compound selector
 * outweighs any number of chained classes, short of the host also using an
 * id (which none of ours has reason to collide with) or `!important`.
 *
 * If the same widget instance renders more than once on one page, this id
 * is technically duplicated — invalid HTML, but harmless here: nothing
 * looks the element up by this id (`ensureStyles`'s lookup uses
 * `STYLE_ELEMENT_ID`, a different, always-unique id on the `<style>`
 * element itself), and every browser still applies an id *selector* to
 * every element carrying that id, duplicated or not.
 */
export const ROOT_ID = "podcast-display-widget-root";

/**
 * The widget's stylesheet, compiled from `styles.scss`.
 *
 * MAN colours, radius and type come from the shared `@shared/stylings/
 * man-tokens` module (`var(--man-x, <fallback>)`), the same fallback
 * approach `content-tabs` uses: the host page is not guaranteed to have the
 * MAN theme loaded, so every value still has to work on its own.
 */
export const PODCAST_DISPLAY_CSS = styles;

/**
 * Puts the stylesheet into the document, once.
 *
 * Several podcast blocks may sit on one page, and every block would
 * otherwise add its own copy. The id is both the marker and the way back to
 * it.
 */
export function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ELEMENT_ID) !== null) return;

  const style = doc.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = PODCAST_DISPLAY_CSS;
  doc.head.appendChild(style);
}
