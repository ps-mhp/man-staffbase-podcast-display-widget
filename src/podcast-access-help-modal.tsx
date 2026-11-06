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

/**
 * The modal behind the "podcast missing?" link. Loaded only when the link is
 * clicked: it is `@shared/ui`, which has no place in the page bundle.
 */

import React from "react";

import { Button } from "@shared/ui/button";
import { ConfigModal } from "@shared/ui/config-modal";

import { PodcastAccessHelpText } from "./podcast-access-help-translations";

export interface PodcastAccessHelpModalProps {
  text: PodcastAccessHelpText;
  /** The link that opened it — the modal goes into that link's dialog. */
  within: Element | null;
  onClose: () => void;
}

export function PodcastAccessHelpModal({ text, within, onClose }: PodcastAccessHelpModalProps): React.JSX.Element {
  return (
    <ConfigModal
      testId="podcast-access-help-modal"
      within={within}
      label={text.title}
      // Small and content-sized — the default fits a full editor.
      panelClassName="h-auto max-h-[80vh] w-[min(480px,90vw)]"
      bodyClassName="block overflow-auto"
    >
      <h3 className="mb-3 text-base font-semibold">{text.title}</h3>
      {text.body.map((paragraph, index) => (
        <p key={index} className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
      <Button variant="outline" size="sm" onClick={onClose} data-testid="podcast-access-help-close">
        {text.close}
      </Button>
    </ConfigModal>
  );
}
