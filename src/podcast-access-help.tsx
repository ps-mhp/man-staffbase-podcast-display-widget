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

import React, { useState } from "react";

import { ConfigModal } from "@shared/config-modal";

import { documentLocales } from "./podcast-content";
import { pickPodcastAccessHelpText } from "./podcast-access-help-translations";

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

/** The episode-picker's own trigger: red rather than blue, so a real problem
 * with the currently selected podcast reads as a warning, not a footnote. */
const warningLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: "#dc2626",
  fontWeight: 600,
};

/** Small and content-sized — `ConfigModal`'s own default fits a full editor. */
const panelStyle: React.CSSProperties = {
  width: "min(480px, 90vw)",
  height: "auto",
  maxHeight: "80vh",
};

const bodyStyle: React.CSSProperties = {
  display: "block",
  overflow: "auto",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#374151",
};

const closeButtonStyle: React.CSSProperties = {
  marginTop: "4px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  background: "#fff",
  color: "#111827",
  padding: "8px 16px",
  fontSize: "13px",
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
 */
export function PodcastAccessHelp(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const text = pickPodcastAccessHelpText(documentLocales());

  return (
    <>
      <button type="button" style={linkStyle} onClick={() => setOpen(true)} data-testid="podcast-access-help-link">
        {text.linkText}
      </button>
      {open && (
        <ConfigModal testId="podcast-access-help-modal" panelStyle={panelStyle} bodyStyle={bodyStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#111827" }}>{text.title}</h3>
          {text.body.map((paragraph, index) => (
            <p key={index} style={paragraphStyle}>
              {paragraph}
            </p>
          ))}
          <button
            type="button"
            style={closeButtonStyle}
            onClick={() => setOpen(false)}
            data-testid="podcast-access-help-close"
          >
            {text.close}
          </button>
        </ConfigModal>
      )}
    </>
  );
}
