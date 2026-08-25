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

import { AI_LABELS, pickAiLabel } from "./ai-label";

describe("pickAiLabel", () => {
  it("uses the abbreviation of the exact locale", () => {
    expect(pickAiLabel(["de_DE"])).toBe("KI");
    expect(pickAiLabel(["es_ES"])).toBe("IA");
    expect(pickAiLabel(["en_US"])).toBe("AI");
  });

  it("falls back to the base language", () => {
    expect(pickAiLabel(["de_AT"])).toBe("KI");
    expect(pickAiLabel(["fr_BE"])).toBe("IA");
  });

  it("takes the first locale that is known", () => {
    expect(pickAiLabel(["ja_JP", "it_IT"])).toBe("IA");
  });

  it("falls back to AI for a language it has no entry for", () => {
    expect(pickAiLabel(["ja_JP"])).toBe("AI");
    expect(pickAiLabel([])).toBe("AI");
  });

  it("covers every language of the branch", () => {
    expect(Object.keys(AI_LABELS).sort()).toEqual(["de_DE", "en_US", "es_ES", "fr_FR", "it_IT", "nl_NL", "pl_PL"]);
  });
});
