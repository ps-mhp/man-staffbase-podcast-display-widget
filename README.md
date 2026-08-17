# podcast-display-widget

Zeigt eine Episode eines `ai-podcast`-Plugins an der Stelle an, an der das
Widget platziert wird: entweder immer die neueste Episode oder eine fest
gewählte. Konfiguriert werden die Podcast-ID (oder die Podcast-URL, aus der
die ID gelesen wird), der Anzeigemodus ("Neueste Episode" / "Bestimmte
Episode") und — im letzteren Fall — die Episode-ID.

Abgerufen wird `GET /api/ai-podcast/<podcastId>/episode-audio` mit dem
Sessioncookie des Nutzers, es gelten also dessen Leseberechtigungen
unverändert. Im Modus "Bestimmte Episode" wird die Liste über bis zu 10
Seiten durchblättert, bis die passende Episode-ID gefunden ist.

Staffbase-Custom-Widget. Entwickelt, gebaut und released wird es aus dem
Meta-Repo [`ps-mhp/man-staffbase-cms-extensions`](https://github.com/ps-mhp/man-staffbase-cms-extensions);
dieses Repo enthält nur Quellcode und das ausgelieferte Bundle unter `dist/`.

```bash
scripts/sync.sh podcast-display-widget
npm run build -- --env widget=podcast-display-widget
npm test -- src/widgets/podcast-display-widget
scripts/release.sh podcast-display-widget
```
