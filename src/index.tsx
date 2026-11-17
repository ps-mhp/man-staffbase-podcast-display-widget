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

import { startWidget } from "@shared/dev-mode/start-widget";
import { setPublicPathFromBundle } from "@shared/public-path";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("podcast-display-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";

import { ALL_ATTRIBUTES, configurationSchema, uiSchema } from "./configuration-schema";
import { resolvePodcastConfig } from "./podcast-config";
import { startPodcastDialog } from "./podcast-dialog";
import { PodcastView } from "./podcast-view";
import icon from "../resources/podcast-display-widget.svg";
import pkg from "../package.json";

export {
  DISPLAY_MODE_ATTRIBUTE,
  EPISODE_ID_ATTRIBUTE,
  PLAYER_SIZE_ATTRIBUTE,
  PODCAST_CONFIG_ATTRIBUTE,
  PODCAST_ID_ATTRIBUTE,
} from "./configuration-schema";

/**
 * Attributes handled by the widget; taken from the configuration schema so
 * the two cannot drift apart. A typo here would otherwise surface only at
 * runtime, as an attribute that silently stays empty.
 */
const widgetAttributes: string[] = ALL_ATTRIBUTES;

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class PodcastDisplayWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public renderBlock(container: HTMLElement): void {
      // `podcast-config`, solange es dort etwas Brauchbares gibt; sonst die
      // einzelnen Felder älterer Fassungen (`podcast-config.ts`).
      const config = resolvePodcastConfig(this.parseAttributes<Record<string, unknown>>());

      // The SDK is assumed to pass the same container for the life of the block.
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(
        <PodcastView
          podcastId={config.podcastId === "" ? null : config.podcastId}
          displayMode={config.mode}
          episodeId={config.episodeId ?? null}
          playerSize={config.size}
        />,
      );
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
// Registration runs through `startWidget`, which first asks whether a local
// development server serves this widget. On virtually every browser the answer
// is no and this registers immediately; on the developer's machine the local
// bundle takes over and registers instead. Only ever one of the two, a block
// name cannot be claimed twice.
//
// Das Fenster „Podcast einstellen“ hängt am Anmelden, nicht am Laden: auf
// Modulebene gestartet, belegte das installierte Bündel das Feld
// `podcast-config`, bevor feststeht, ob ein lokaler Entwicklungsserver
// übernimmt – dann käme die Ansicht von dort, das Fenster aber aus der
// veröffentlichten Fassung (im Hero-Slider-Widget so beobachtet).
if (typeof window.defineBlock === "function") {
  void startWidget({
    name: "podcast-display-widget",
    version: pkg.version,
    register: () => {
      startPodcastDialog();
      window.defineBlock(externalBlockDefinition);
    },
  });
}
