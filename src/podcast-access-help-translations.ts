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

/** Copy for the "podcast missing?" link and the modal it opens. */
export interface PodcastAccessHelpText {
  /** The link shown under the podcast picker. */
  linkText: string;
  /**
   * The red warning link shown next to the episode picker's own "could not
   * load" notice, without the leading "⚠" — the icon is added in code (see
   * `podcast-access-help.tsx`) rather than baked into every translation, since
   * it is not language-specific.
   */
  episodesUnavailableLabel: string;
  /** The modal's heading. */
  title: string;
  /** The modal's explanation, as separate paragraphs. */
  body: string[];
  /** Heading above `resolveSteps`. */
  resolveStepsTitle: string;
  /** What to actually do about it, in order. */
  resolveSteps: string[];
  /** The modal's dismiss button. */
  close: string;
}

/**
 * One entry per language this Staffbase branch is actually configured for
 * (`config.availableLocales` on the branch, checked live against the API
 * rather than assumed) — not a guess at "every language Staffbase supports"
 * this widget has no way to verify.
 *
 * "Space" is left untranslated everywhere: it is Staffbase's own product term
 * for the concept, not a phrase authors are meant to translate for readers,
 * and every locale in Staffbase's own admin UI keeps it in English too.
 */
export const PODCAST_ACCESS_HELP_TRANSLATIONS: Record<string, PodcastAccessHelpText> = {
  de_DE: {
    linkText: "Podcast nicht auffindbar?",
    episodesUnavailableLabel: "Episoden können nicht geladen werden",
    title: "Podcast nicht auffindbar?",
    body: [
      "Nicht jeder installierte Podcast erscheint in dieser Liste. Ein Podcast wird ausgeblendet, wenn für das aktuell angemeldete Konto gerade keine Episode abgerufen werden kann.",
      "Meist liegt das an den Zugriffsrechten des Space, in dem der Podcast liegt – unabhängig davon, ob man als Bearbeiter/in für den Podcast selbst eingetragen ist. Auch eine gelöschte Gruppe, auf die die Zugriffsregel verweist, kann dazu führen, dass niemand mehr zugreifen kann.",
      "Bitte eine Administratorin oder einen Administrator bitten, den Zugriff auf den betreffenden Space zu prüfen und gegebenenfalls anzupassen. Danach taucht der Podcast hier automatisch wieder auf.",
    ],
    resolveStepsTitle: "Lösungsschritte",
    resolveSteps: [
      "Prüfen, ob der Podcast überhaupt schon veröffentlichte Episoden hat.",
      "Prüfen, ob der eigene Account Mitglied des Space ist, in dem der Podcast liegt – nicht nur als Bearbeiter/in der Installation eingetragen.",
      "Falls der Zugriff über eine Gruppe geregelt ist: prüfen, ob diese Gruppe noch existiert.",
      "Eine Administratorin oder einen Administrator bitten, den Zugriff auf den betreffenden Space zu prüfen und gegebenenfalls anzupassen.",
      "Nach der Anpassung die Konfigurationsseite neu laden.",
    ],
    close: "Schließen",
  },
  en_US: {
    linkText: "Podcast missing?",
    episodesUnavailableLabel: "Episodes cannot be loaded",
    title: "Podcast missing?",
    body: [
      "Not every installed podcast shows up in this list. A podcast is hidden when no episode can currently be retrieved for the account you are signed in with.",
      "This is usually caused by the access rights of the Space the podcast lives in — independent of whether you are listed as an editor for the podcast itself. A deleted group referenced by the access rule can also mean nobody can access it anymore.",
      "Please ask an administrator to review (and adjust, if needed) access to that Space. The podcast will then reappear here automatically.",
    ],
    resolveStepsTitle: "Resolve steps",
    resolveSteps: [
      "Check whether the podcast has any published episodes at all.",
      "Check whether your own account is a member of the Space the podcast lives in — not just listed as an editor of the installation.",
      "If access is governed by a group, check whether that group still exists.",
      "Ask an administrator to review (and adjust, if needed) access to that Space.",
      "Reload the configuration page once access has been adjusted.",
    ],
    close: "Close",
  },
  it_IT: {
    linkText: "Podcast introvabile?",
    episodesUnavailableLabel: "Impossibile caricare gli episodi",
    title: "Podcast introvabile?",
    body: [
      "Non tutti i podcast installati compaiono in questo elenco. Un podcast viene nascosto quando al momento non è possibile recuperare alcun episodio per l'account con cui hai effettuato l'accesso.",
      "Di solito la causa sono i diritti di accesso dello Space in cui si trova il podcast, indipendentemente dal fatto che tu sia elencato/a come editor del podcast stesso. Anche un gruppo eliminato a cui fa riferimento la regola di accesso può fare in modo che nessuno vi possa più accedere.",
      "Chiedi a un amministratore o un'amministratrice di verificare (ed eventualmente correggere) l'accesso a quello Space. Il podcast ricomparirà quindi automaticamente qui.",
    ],
    resolveStepsTitle: "Passaggi risolutivi",
    resolveSteps: [
      "Verifica se il podcast ha effettivamente episodi pubblicati.",
      "Verifica se il tuo account è membro dello Space in cui si trova il podcast, non solo elencato come editor dell'installazione.",
      "Se l'accesso è gestito tramite un gruppo, verifica se quel gruppo esiste ancora.",
      "Chiedi a un amministratore o un'amministratrice di verificare (ed eventualmente correggere) l'accesso a quello Space.",
      "Dopo la modifica, ricarica la pagina di configurazione.",
    ],
    close: "Chiudi",
  },
  es_ES: {
    linkText: "¿No encuentras el podcast?",
    episodesUnavailableLabel: "No se pueden cargar los episodios",
    title: "¿No encuentras el podcast?",
    body: [
      "No todos los podcasts instalados aparecen en esta lista. Un podcast se oculta cuando actualmente no se puede obtener ningún episodio para la cuenta con la que has iniciado sesión.",
      "Esto suele deberse a los permisos de acceso del Space en el que se encuentra el podcast, independientemente de si figuras como editor/a del propio podcast. Un grupo eliminado al que hace referencia la regla de acceso también puede provocar que ya nadie pueda acceder.",
      "Pide a una persona administradora que revise (y ajuste si es necesario) el acceso a ese Space. El podcast volverá a aparecer aquí automáticamente.",
    ],
    resolveStepsTitle: "Pasos para solucionarlo",
    resolveSteps: [
      "Comprueba si el podcast tiene realmente episodios publicados.",
      "Comprueba si tu cuenta es miembro del Space en el que se encuentra el podcast, no solo si figuras como editor/a de la instalación.",
      "Si el acceso se gestiona mediante un grupo, comprueba si ese grupo todavía existe.",
      "Pide a una persona administradora que revise (y ajuste si es necesario) el acceso a ese Space.",
      "Vuelve a cargar la página de configuración después del ajuste.",
    ],
    close: "Cerrar",
  },
  fr_FR: {
    linkText: "Podcast introuvable ?",
    episodesUnavailableLabel: "Impossible de charger les épisodes",
    title: "Podcast introuvable ?",
    body: [
      "Tous les podcasts installés n'apparaissent pas dans cette liste. Un podcast est masqué lorsqu'aucun épisode ne peut actuellement être récupéré pour le compte avec lequel vous êtes connecté(e).",
      "Cela est généralement dû aux droits d'accès du Space dans lequel se trouve le podcast, indépendamment du fait que vous soyez répertorié(e) comme éditeur/éditrice du podcast lui-même. Un groupe supprimé référencé par la règle d'accès peut également faire en sorte que plus personne n'y ait accès.",
      "Demandez à un administrateur ou une administratrice de vérifier (et si nécessaire d'ajuster) l'accès à ce Space. Le podcast réapparaîtra alors automatiquement ici.",
    ],
    resolveStepsTitle: "Étapes de résolution",
    resolveSteps: [
      "Vérifiez si le podcast possède réellement des épisodes publiés.",
      "Vérifiez si votre compte est membre du Space dans lequel se trouve le podcast, et pas seulement répertorié comme éditeur de l'installation.",
      "Si l'accès est géré via un groupe, vérifiez si ce groupe existe encore.",
      "Demandez à un administrateur ou une administratrice de vérifier (et si nécessaire d'ajuster) l'accès à ce Space.",
      "Rechargez la page de configuration une fois l'accès ajusté.",
    ],
    close: "Fermer",
  },
  nl_NL: {
    linkText: "Podcast niet te vinden?",
    episodesUnavailableLabel: "Afleveringen kunnen niet worden geladen",
    title: "Podcast niet te vinden?",
    body: [
      "Niet elke geïnstalleerde podcast verschijnt in deze lijst. Een podcast wordt verborgen wanneer er momenteel geen aflevering kan worden opgehaald voor het account waarmee je bent ingelogd.",
      "Dit komt meestal door de toegangsrechten van de Space waarin de podcast zich bevindt, ongeacht of je als redacteur voor de podcast zelf geregistreerd staat. Ook een verwijderde groep waarnaar de toegangsregel verwijst, kan ervoor zorgen dat niemand meer toegang heeft.",
      "Vraag een beheerder om de toegang tot die Space te controleren (en zo nodig aan te passen). De podcast verschijnt dan automatisch weer hier.",
    ],
    resolveStepsTitle: "Oplossingsstappen",
    resolveSteps: [
      "Controleer of de podcast überhaupt gepubliceerde afleveringen heeft.",
      "Controleer of je eigen account lid is van de Space waarin de podcast zich bevindt — niet alleen geregistreerd als redacteur van de installatie.",
      "Als de toegang via een groep wordt geregeld: controleer of die groep nog bestaat.",
      "Vraag een beheerder om de toegang tot die Space te controleren (en zo nodig aan te passen).",
      "Herlaad de configuratiepagina zodra de toegang is aangepast.",
    ],
    close: "Sluiten",
  },
  pt_PT: {
    linkText: "Não encontra o podcast?",
    episodesUnavailableLabel: "Não é possível carregar os episódios",
    title: "Não encontra o podcast?",
    body: [
      "Nem todos os podcasts instalados aparecem nesta lista. Um podcast é ocultado quando não é possível obter atualmente nenhum episódio para a conta com que iniciou sessão.",
      "Isto deve-se normalmente aos direitos de acesso do Space onde o podcast se encontra, independentemente de estar registado(a) como editor(a) do próprio podcast. Um grupo eliminado referenciado pela regra de acesso também pode fazer com que ninguém consiga aceder.",
      "Peça a um(a) administrador(a) para verificar (e, se necessário, ajustar) o acesso a esse Space. O podcast voltará então a aparecer aqui automaticamente.",
    ],
    resolveStepsTitle: "Passos para resolver",
    resolveSteps: [
      "Verifique se o podcast tem, de facto, episódios publicados.",
      "Verifique se a sua conta é membro do Space onde o podcast se encontra — e não apenas registada como editor(a) da instalação.",
      "Se o acesso for gerido por um grupo, verifique se esse grupo ainda existe.",
      "Peça a um(a) administrador(a) para verificar (e, se necessário, ajustar) o acesso a esse Space.",
      "Recarregue a página de configuração depois de o acesso ser ajustado.",
    ],
    close: "Fechar",
  },
  pl_PL: {
    linkText: "Nie widzisz podcastu?",
    episodesUnavailableLabel: "Nie można wczytać odcinków",
    title: "Nie widzisz podcastu?",
    body: [
      "Nie każdy zainstalowany podcast pojawia się na tej liście. Podcast jest ukrywany, gdy aktualnie nie można pobrać żadnego odcinka dla konta, na które jesteś zalogowany/a.",
      "Zwykle wynika to z uprawnień dostępu do Space, w którym znajduje się podcast, niezależnie od tego, czy figurujesz jako redaktor/redaktorka samego podcastu. Usunięta grupa, do której odwołuje się reguła dostępu, również może sprawić, że nikt nie ma już dostępu.",
      "Poproś administratora lub administratorkę o sprawdzenie (i w razie potrzeby dostosowanie) dostępu do tego Space. Podcast pojawi się wtedy tutaj ponownie automatycznie.",
    ],
    resolveStepsTitle: "Kroki rozwiązania problemu",
    resolveSteps: [
      "Sprawdź, czy podcast w ogóle ma opublikowane odcinki.",
      "Sprawdź, czy Twoje konto jest członkiem Space, w którym znajduje się podcast — a nie tylko figuruje jako redaktor instalacji.",
      "Jeśli dostęp jest regulowany przez grupę, sprawdź, czy ta grupa nadal istnieje.",
      "Poproś administratora lub administratorkę o sprawdzenie (i w razie potrzeby dostosowanie) dostępu do tego Space.",
      "Po dostosowaniu dostępu odśwież stronę konfiguracji.",
    ],
    close: "Zamknij",
  },
};

/**
 * The help text in the reader's language, following the same fallback chain
 * as `pickLocalizedTitle` in `podcast-content.ts`: the exact locale, then its
 * language alone, then `en_US`, so an author whose editor locale is not one
 * of the branch's own configured languages still gets an answer instead of
 * nothing.
 */
export function pickPodcastAccessHelpText(locales: string[]): PodcastAccessHelpText {
  for (const locale of locales) {
    const exact = PODCAST_ACCESS_HELP_TRANSLATIONS[locale];
    if (exact) return exact;
  }

  for (const locale of locales) {
    const language = locale.split("_")[0].toLowerCase();
    const key = Object.keys(PODCAST_ACCESS_HELP_TRANSLATIONS).find(
      (candidate) => candidate.split("_")[0].toLowerCase() === language,
    );
    if (key) return PODCAST_ACCESS_HELP_TRANSLATIONS[key];
  }

  return PODCAST_ACCESS_HELP_TRANSLATIONS.en_US;
}
