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
 * Die Abschnitte der Hauptfläche: Anzeige, Player und – zugeklappt – die
 * Eingabe einer ID von Hand.
 *
 * Podcast und Episode werden links im Baum gewählt; hier stehen sie nur zum
 * Ablesen, damit man auch in einer Geräteansicht sieht, was gilt. Die Eingabe
 * von Hand ist der Ausweg, den der Dialog schon bisher bot: lädt die Liste
 * nicht, lässt sich die ID oder die ganze Adresse einfügen.
 */

import * as React from "react";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { Segmented, SegmentedOption } from "@man/config-ui/form/segmented";
import { Input } from "@man/config-ui/primitives/input";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import type { PodcastConfig, PodcastMode, PodcastPlayerSize } from "./podcast-config";
import { readEpisodeId, readPodcastId } from "./podcast-content";
import { EPISODE_ISSUE, PODCAST_ISSUE, validatePodcastConfig } from "./podcast-editor-rules";
import { applyTreeTarget } from "./podcast-tree";

const MODE_OPTIONS: readonly SegmentedOption<PodcastMode>[] = [
  { id: "latest", label: "Neueste Episode" },
  { id: "specific", label: "Bestimmte Episode" },
];

const SIZE_OPTIONS: readonly SegmentedOption<PodcastPlayerSize>[] = [
  { id: "large", label: "Groß" },
  { id: "small", label: "Kompakt" },
];

export interface SectionProps {
  value: PodcastConfig;
  onChange: (value: PodcastConfig) => void;
}

/** Die Meldung zu `id`, aber erst, wenn „Übernehmen“ an ihr gescheitert ist. */
function useIssue(value: PodcastConfig, id: string): string | undefined {
  const { issuesVisible } = useConfigShell();
  if (!issuesVisible) return undefined;
  return validatePodcastConfig(value).find((issue) => issue.id === id)?.message;
}

export interface DisplaySectionProps extends SectionProps {
  /** Titel des gewählten Podcasts, sonst seine ID; leer ohne Wahl. */
  podcastLabel: string;
  /** Titel der gewählten Episode, sonst ihre ID; leer ohne Wahl. */
  episodeLabel: string;
}

export function DisplaySection({ value, onChange, podcastLabel, episodeLabel }: DisplaySectionProps): React.ReactElement {
  const podcastIssue = useIssue(value, PODCAST_ISSUE);
  const episodeIssue = useIssue(value, EPISODE_ISSUE);
  return (
    <FormSection title="Anzeige">
      <Field label="Podcast" required error={podcastIssue} hint={podcastLabel === "" ? "Podcast links in der Liste wählen" : undefined}>
        <Input readOnly value={podcastLabel} placeholder="Noch kein Podcast gewählt" />
      </Field>
      <Segmented aria-label="Welche Episode" options={MODE_OPTIONS} value={value.mode} onChange={(mode) => onChange({ ...value, mode })} />
      {value.mode === "specific" && (
        <Field label="Episode" required error={episodeIssue} hint={episodeLabel === "" ? "Episode links in der Liste wählen" : undefined}>
          <Input readOnly value={episodeLabel} placeholder="Noch keine Episode gewählt" />
        </Field>
      )}
    </FormSection>
  );
}

export function PlayerSection({ value, onChange }: SectionProps): React.ReactElement {
  return (
    <FormSection
      title="Player"
      description="Groß: Cover, Titel, Datum und volle Steuerung. Kompakt: schmale Kachel mit Play und Fortschritt, für Feeds und schmale Spalten."
    >
      <Segmented aria-label="Player-Größe" options={SIZE_OPTIONS} value={value.size} onChange={(size) => onChange({ ...value, size })} />
    </FormSection>
  );
}

interface IdFieldProps {
  label: string;
  current: string | undefined;
  read: (raw: unknown) => string | null;
  onValid: (id: string) => void;
}

/** Ein Feld für eine eingefügte ID oder Adresse; übernommen wird erst, was sich als ID lesen lässt. */
function IdField({ label, current, read, onValid }: IdFieldProps): React.ReactElement {
  const [text, setText] = React.useState("");
  const unreadable = text.trim() !== "" && read(text) === null;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setText(event.target.value);
    const id = read(event.target.value);
    if (id !== null && id !== current) onValid(id);
  };
  return (
    <Field label={label} error={unreadable ? "Keine gültige ID erkannt" : undefined} hint={`Aktuell: ${current ?? "–"}`}>
      <Input value={text} onChange={handleChange} placeholder="ID oder Adresse einfügen" />
    </Field>
  );
}

export function ManualIdsSection({ value, onChange }: SectionProps): React.ReactElement {
  return (
    <FormSection
      title="ID von Hand eintragen"
      description="Nur nötig, wenn die Liste links nicht lädt: die ID oder die ganze Adresse aus Staffbase einfügen."
      collapsible
      defaultOpen={false}
    >
      <IdField
        label="Podcast-ID oder Adresse"
        current={value.podcastId === "" ? undefined : value.podcastId}
        read={readPodcastId}
        onValid={(podcastId) => onChange(applyTreeTarget(value, { kind: "podcast", podcastId }))}
      />
      <IdField
        label="Episode-ID oder Adresse der Audiodatei"
        current={value.episodeId}
        read={readEpisodeId}
        onValid={(episodeId) => onChange({ ...value, mode: "specific", episodeId })}
      />
    </FormSection>
  );
}
