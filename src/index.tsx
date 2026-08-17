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

import { setPublicPathFromBundle } from "@shared/public-path";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("podcast-display-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { readPodcastId, readEpisodeId } from "./podcast-content";
import { DisplayMode, PodcastView } from "./podcast-view";
import icon from "../resources/podcast-display-widget.svg";
import pkg from "../package.json";

/**
 * The names the configuration goes by.
 *
 * Each has to be spelled the same in three places: the key in the
 * configuration schema, the attribute declared to the host, and the name
 * read back here. They are also the attributes registered for this widget in
 * `widgets.json`.
 */
export const PODCAST_ID_ATTRIBUTE = "podcast-id";
export const DISPLAY_MODE_ATTRIBUTE = "display-mode";
export const EPISODE_ID_ATTRIBUTE = "episode-id";

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [PODCAST_ID_ATTRIBUTE, DISPLAY_MODE_ATTRIBUTE, EPISODE_ID_ATTRIBUTE];

/** Anything other than the literal `"specific"` means "latest" — including an unset or stale value. */
function readDisplayMode(raw: unknown): DisplayMode {
  return raw === "specific" ? "specific" : "latest";
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class PodcastDisplayWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public renderBlock(container: HTMLElement): void {
      const attrs = this.parseAttributes<Record<string, unknown>>();
      const podcastId = readPodcastId(attrs[PODCAST_ID_ATTRIBUTE]);
      const displayMode = readDisplayMode(attrs[DISPLAY_MODE_ATTRIBUTE]);
      const episodeId = readEpisodeId(attrs[EPISODE_ID_ATTRIBUTE]);

      // The SDK is assumed to pass the same container for the life of the block.
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<PodcastView podcastId={podcastId} displayMode={displayMode} episodeId={episodeId} />);
    }

    public unmountBlock(_container: HTMLElement): void {
      this._root?.unmount();
      this._root = null;
    }

    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

const blockDefinition: BlockDefinition = {
  name: "podcast-display-widget",
  factory: factory,
  attributes: widgetAttributes,
  blockLevel: "block",
  configurationSchema: configurationSchema,
  uiSchema: uiSchema,
  label: "PodcastDisplay",
  iconUrl: icon,
};

const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version,
};

// The guard lets the module load in Jest/jsdom where defineBlock is absent,
// while keeping the call unconditional in the real Staffbase host, where it
// is always present — in the editor and on a published page alike.
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
}
