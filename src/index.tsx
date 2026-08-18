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
import { startConditionalFieldVisibility } from "@shared/conditional-field-visibility";
import { configFieldSelector } from "@shared/config-field-injector";
import { fetchEntityCatalog } from "@shared/entity-picker/entity-catalog";
import { startEntityPickerInjector } from "@shared/entity-picker/entity-picker-injector";

import { configurationSchema, uiSchema } from "./configuration-schema";
import { createEpisodeCatalogSource } from "./episode-catalog";
import { podcastCatalogSource } from "./podcast-catalog";
import { PodcastAccessHelp } from "./podcast-access-help";
import { readPodcastId, readEpisodeId } from "./podcast-content";
import { PlayerSize } from "./podcast-player";
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
export const PLAYER_SIZE_ATTRIBUTE = "player-size";

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [
  PODCAST_ID_ATTRIBUTE,
  DISPLAY_MODE_ATTRIBUTE,
  EPISODE_ID_ATTRIBUTE,
  PLAYER_SIZE_ATTRIBUTE,
];

/** Copy for the dropdown next to the `podcast-id` field. */
const PODCAST_PICKER_LABELS = {
  placeholder: "Podcast auswählen …",
  manualOption: "Andere ID eingeben …",
  unavailableNotice:
    "Die Liste der Podcasts konnte nicht geladen werden. Bitte die Installations-ID eintragen.",
};

/** Copy for the dropdown next to the `episode-id` field. */
const EPISODE_PICKER_LABELS = {
  placeholder: "Episode auswählen …",
  manualOption: "Andere ID eingeben …",
  unavailableNotice:
    "Die Liste der Episoden konnte nicht geladen werden (oder es ist noch kein Podcast ausgewählt). Bitte die Episode-ID eintragen.",
};

/**
 * The `podcast-id` field's live value, read straight out of the dialog's DOM.
 *
 * The episode catalog depends on it but is not itself rendered from the same
 * state — there is no shared component tree between the two fields' pickers
 * — so this is how the episode picker learns which podcast is currently
 * selected, both on first load and every time `watchFields` re-triggers it.
 */
function readSelectedPodcastId(): string | null {
  const field = document.querySelector<HTMLInputElement>(configFieldSelector(PODCAST_ID_ATTRIBUTE));
  return field ? readPodcastId(field.value) : null;
}

/**
 * Watches for the configuration dialog from module load on.
 *
 * See the survey widget's `stopSurveyPickerInjector` for why this runs
 * unconditionally at module scope rather than from a render.
 *
 * Exported only so tests can dispose of the observer on teardown; production
 * code never calls this.
 */
export const stopPodcastPickerInjector = startEntityPickerInjector({
  fieldKey: PODCAST_ID_ATTRIBUTE,
  fetchOptions: () => fetchEntityCatalog(podcastCatalogSource),
  labels: PODCAST_PICKER_LABELS,
  helpLink: <PodcastAccessHelp />,
});

/** Same as `stopPodcastPickerInjector`, for the `episode-id` field. */
export const stopEpisodePickerInjector = startEntityPickerInjector({
  fieldKey: EPISODE_ID_ATTRIBUTE,
  fetchOptions: () => fetchEntityCatalog(createEpisodeCatalogSource(readSelectedPodcastId)),
  labels: EPISODE_PICKER_LABELS,
  watchFields: [PODCAST_ID_ATTRIBUTE],
});

/**
 * The `episode-id` field only means anything in "specific episode" mode; in
 * "latest episode" mode it is dead weight in the dialog — an empty box next
 * to a picker that, per `EPISODE_PICKER_LABELS.unavailableNotice`, may well
 * also be showing its own "could not load" text with nothing to load it for.
 * Hidden as a whole row (see `conditional-field-visibility.ts`), not just the
 * raw input, so its label and help text disappear with it.
 */
export const stopEpisodeVisibilityToggle = startConditionalFieldVisibility({
  controllingFieldKey: DISPLAY_MODE_ATTRIBUTE,
  hiddenFieldKey: EPISODE_ID_ATTRIBUTE,
  shouldHide: (displayMode) => displayMode !== "specific",
});

/** Anything other than the literal `"specific"` means "latest" — including an unset or stale value. */
function readDisplayMode(raw: unknown): DisplayMode {
  return raw === "specific" ? "specific" : "latest";
}

/** Anything other than the literal `"small"` means "large" — including an unset or stale value, and the schema's own default. */
function readPlayerSize(raw: unknown): PlayerSize {
  return raw === "small" ? "small" : "large";
}

const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class PodcastDisplayWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public renderBlock(container: HTMLElement): void {
      const attrs = this.parseAttributes<Record<string, unknown>>();
      const podcastId = readPodcastId(attrs[PODCAST_ID_ATTRIBUTE]);
      const displayMode = readDisplayMode(attrs[DISPLAY_MODE_ATTRIBUTE]);
      const episodeId = readEpisodeId(attrs[EPISODE_ID_ATTRIBUTE]);
      const playerSize = readPlayerSize(attrs[PLAYER_SIZE_ATTRIBUTE]);

      // The SDK is assumed to pass the same container for the life of the block.
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(
        <PodcastView podcastId={podcastId} displayMode={displayMode} episodeId={episodeId} playerSize={playerSize} />,
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
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
}
