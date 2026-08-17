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

/** Id of the single style element, which is also how it is recognised again. */
export const STYLE_ELEMENT_ID = "podcast-display-widget-styles";

/**
 * The widget's stylesheet.
 *
 * Colours and fonts are inherited on purpose, same reasoning as in the post
 * widget: the block sits inside a page that already has a design. Only
 * spacing and the containment of the thumbnail and player are stated here.
 */
export const PODCAST_DISPLAY_CSS = `
.podcast-display {
  box-sizing: border-box;
  display: block;
  line-height: 1.55;
  min-width: 0;
}

.podcast-display__thumbnail {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 0.5em;
  margin: 0 0 0.75em;
}

.podcast-display__title {
  font-size: 1.4em;
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 0.25em;
}

.podcast-display__date {
  margin: 0 0 0.75em;
  opacity: 0.75;
}

.podcast-display__audio {
  display: block;
  width: 100%;
}

.podcast-display__status,
.podcast-display__error {
  margin: 0;
  opacity: 0.75;
}

.podcast-display__error {
  color: #b3261e;
  opacity: 1;
}
`;

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
