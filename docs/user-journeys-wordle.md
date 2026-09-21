# Wordle activity builder — teacher user journeys

Teacher-focused map of Phoneme Wordle configuration, persistence, and export. Student preview play is only covered where it sits in **panel 3**.

**Primary sources:** `app/wordle/page.tsx`, `components/wordle/WordleBuilder.tsx`, `components/shared/SavedActivitiesPanel.tsx`, `components/shared/CorpusWordManager.tsx`, `hooks/useSavedActivities.tsx`, `dal/reference.ts`, `app/actions/corpus.ts`.

---

## 1. Actor and goal

| Actor | Role |
| --- | --- |
| **Teacher** | Manages the DB word bank, configures Wordle activities from that bank, saves activity configs, and downloads offline HTML. |

**Goal:** Configure a phoneme Wordle from database words (no separate “custom” mode), keep named activity configs in Postgres, and export `phoneme-wordle.html`.

There is **no** HCE corpus vs custom mode. All selectable words live in `corpus_words` / `corpus_word_phonemes` and are maintained with CRUD.

---

## 2. Layout

1. **Library** — saved activity configs (create / select / rename / delete) **and** the **Word bank** (add / edit / delete DB words).
2. **Configure** — pick phoneme length + target word from the bank; set difficulty; **Save** | **Save as new** | **Generate and download HTML**.
3. **Preview** — live student game for the selected bank word.

Activity names use modals (first Save / Save as new / pencil rename), not a permanent name field.

---

## 3. Entry and default draft

- Nav / home → `/wordle`
- SSR loads inventory, keyboard, and corpus from the DAL
- Default draft: length 3, first length-3 bank word, medium difficulty
- Unsaved draft until Save / Save as new

---

## 4. Teacher journeys

### A. Manage the word bank

1. In **Word bank**, click **Add word** (or pencil on a row).
2. Enter English label + phoneme sequence (text and/or palette). Must be 3, 4, or 5 phonemes.
3. **Save word** → `createCorpusWord` / `updateCorpusWord` server action; list refreshes.
4. Trash icon → confirm → `deleteCorpusWord`; activities that had that pick fall back if needed.

### B. Configure from the bank → Save

1. Choose **Phoneme length** and **Target word** from the bank.
2. Set **Difficulty**.
3. Preview updates.
4. **Save** / **Save as new** (name modal when creating) stores an activity with a **snapshot** of the word’s english + phonemes.

### C. Load / rename / delete activities

Same library patterns as before: row select loads; pencil renames; trash deletes; dirty navigation confirms discard.

### D. Generate and download HTML

Draft vs stored generate modes unchanged (clean saved → DB snapshot HTML; otherwise draft HTML).

---

## 5. Edge cases

| Situation | Behaviour |
| --- | --- |
| No bank words for length | Target select empty; Save / Generate disabled |
| Loaded activity word missing from bank | Preview still uses stored snapshot; picker may not match until rematched by english |
| Bank word edited (slug change) | List updates; selection follows new id when edited from this page |
| Invalid editor input | Modal validation blocks Save word |

---

## 6. What this removed

- UI toggle **HCE corpus** / **Custom word entry**
- Activity-local “custom” word state / mode in signatures
- Hard-coded UI prefill lists as the runtime source of truth (seed data remains in DB + `data/` fixtures for migrations/tests)

---

## Related files

| Path | Role |
| --- | --- |
| `dal/reference.ts` | Corpus list + CRUD |
| `app/actions/corpus.ts` | Server actions for word bank |
| `components/shared/CorpusWordManager.tsx` | Word bank UI |
| `components/shared/CorpusWordEditor.tsx` | Add/edit modal |
| `components/wordle/WordleConfigForm.tsx` | Select-only configure |
| `components/wordle/WordleBuilder.tsx` | Orchestration without mode |
