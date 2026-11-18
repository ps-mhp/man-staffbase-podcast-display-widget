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
 * Die Teile des Formulars: Kopf mit dem gewählten Podcast, die Abschnitte
 * Anzeige und Player und – zugeklappt – die Eingabe einer ID von Hand.
 *
 * Aufgebaut wie im Screen: Podcast und Episode werden links im Baum gewählt,
 * hier stehen sie nur zum Ablesen – der Podcast als Überschrift, die Episode
 * als Hinweis. Kleine Wahlen sind Pills mit Label darüber, inhaltsbreit.
 *
 * Dieselben Abschnitte stehen in den Geräteansichten im Inspektor, dort
 * knapp (`detailed={false}`): ohne Hinweise, denn die Vorschau daneben zeigt,
 * was gilt. Fehler nach gescheitertem „Übernehmen“ stehen in beiden.
 *
 * Die Eingabe von Hand ist der Ausweg, den der Dialog schon bisher bot: lädt
 * die Liste nicht, lässt sich die ID oder die ganze Adresse einfügen.
 */

import * as React from "react";
import { Play } from "lucide-react";
import { Field } from "@man/config-ui/form/field";
import { FormHeading } from "@man/config-ui/form/form-heading";
import { FormSection } from "@man/config-ui/form/form-section";
import { IssueText } from "@man/config-ui/form/issue-text";
import { Note } from "@man/config-ui/form/note";
import type { SegmentedOption } from "@man/config-ui/form/segmented";
import { SegmentedField } from "@man/config-ui/form/segmented-field";
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

const SIZE_HINT =
  "Groß zeigt Cover, Titel, Datum und volle Steuerung, Kompakt eine schmale Kachel mit Play und Fortschritt – für Feeds und schmale Spalten.";

/** Beschriftung eines Felds ohne `<label>`, wie bei `Field`. */
const LABEL = "text-[13px] font-semibold text-foreground";

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

export interface PodcastHeadingProps {
  value: PodcastConfig;
  /** Titel des gewählten Podcasts, sonst seine ID. */
  title: string;
  /** Die Zeile daneben, etwa „Podcast · links gewählt“. */
  kicker: string;
}

/** Der Kopf des Formulars: welcher Podcast gilt. Ohne Wahl sagt er, wo man wählt. */
export function PodcastHeading({ value, title, kicker }: PodcastHeadingProps): React.ReactElement {
  const issue = useIssue(value, PODCAST_ISSUE);
  const chosen = value.podcastId !== "";
  return (
    <FormHeading
      title={chosen ? title : "Noch kein Podcast gewählt"}
      kicker={chosen ? kicker : "Podcast links in der Liste wählen"}
      data-testid="podcast-heading"
    >
      {issue !== undefined && <IssueText>{issue}</IssueText>}
    </FormHeading>
  );
}

/** Die gewählte Episode zum Ablesen; gewählt wird sie links im Baum. */
function EpisodeNote({ label, issue }: { label: string; issue: string | undefined }): React.ReactElement {
  const labelId = `${React.useId()}-label`;
  const chosen = label !== "";
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-1.5">
      <span id={labelId} className={LABEL}>
        Episode
      </span>
      <Note icon={Play} data-testid="podcast-episode-note">
        <strong className="font-semibold text-foreground">{chosen ? label : "Noch keine Episode gewählt"}</strong>
        <br />
        {chosen
          ? "In der Liste links gewählt. „Neueste Episode“ wechselt von selbst, sobald eine neue Folge erscheint."
          : "Episode links in der Liste wählen."}
      </Note>
      {issue !== undefined && <IssueText>{issue}</IssueText>}
    </div>
  );
}

export interface DisplaySectionProps extends SectionProps {
  /** Titel der gewählten Episode, sonst ihre ID; leer ohne Wahl. */
  episodeLabel: string;
  /** Im Formular mit Episode als Hinweis; im Inspektor nur die Wahl. */
  detailed: boolean;
}

export function DisplaySection({ value, onChange, episodeLabel, detailed }: DisplaySectionProps): React.ReactElement {
  const podcastIssue = useIssue(value, PODCAST_ISSUE);
  const episodeIssue = useIssue(value, EPISODE_ISSUE);
  const specific = value.mode === "specific";
  return (
    <FormSection title="Anzeige">
      {/* Im Formular nennt der Kopf den fehlenden Podcast; im Inspektor gibt es keinen. */}
      {!detailed && podcastIssue !== undefined && <IssueText>{podcastIssue}</IssueText>}
      <SegmentedField label="Welche Episode" options={MODE_OPTIONS} value={value.mode} onChange={(mode) => onChange({ ...value, mode })} />
      {specific && detailed && <EpisodeNote label={episodeLabel} issue={episodeIssue} />}
      {specific && !detailed && episodeIssue !== undefined && <IssueText>{episodeIssue}</IssueText>}
    </FormSection>
  );
}

export interface PlayerSectionProps extends SectionProps {
  /** Im Formular mit Hinweis, was die Größen zeigen. */
  detailed: boolean;
}

export function PlayerSection({ value, onChange, detailed }: PlayerSectionProps): React.ReactElement {
  return (
    <FormSection title="Player">
      <SegmentedField
        label="Größe"
        options={SIZE_OPTIONS}
        value={value.size}
        onChange={(size) => onChange({ ...value, size })}
        hint={detailed ? SIZE_HINT : undefined}
      />
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
      <Input className="h-10" value={text} onChange={handleChange} placeholder="ID oder Adresse einfügen" />
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
