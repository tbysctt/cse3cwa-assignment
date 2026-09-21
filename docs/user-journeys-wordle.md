# Wordle activity builder — teacher user journeys

Teacher-focused map of Phoneme Wordle configuration, persistence, and export. Student preview play is only covered where it sits in **panel 3**.

**Primary sources:** `app/wordle/page.tsx`, `app/word-bank/page.tsx`, `components/wordle/WordleBuilder.tsx`, `components/shared/SavedActivitiesPanel.tsx`, `components/shared/WordBankModal.tsx`, `components/shared/WordBankManager.tsx`, `hooks/useSavedActivities.tsx`, `dal/reference.ts`, `app/actions/words.ts`.

---

## 1. Actor and goal

| Actor | Role |
| --- | --- |
| **Teacher** | Manages the DB word bank, configures Wordle activities from that bank, saves activity configs, and downloads offline HTML. |

**Goal:** Configure a phoneme Wordle from database words (no separate “custom” mode), keep named activity configs in Postgres, and export `phoneme-wordle.html`.

There is **no** HCE corpus vs custom mode. All selectable words live in `words` / `word_phonemes` and are maintained with CRUD. Saved activities store copies in `activity_words` / `activity_word_phonemes`.

---

## 2. Layout

1. **Library** — saved activity configs (create / select / rename / delete), plus **Add/edit words** which opens the word bank dialog.
2. **Configure** — pick phoneme length + target word from the bank; set difficulty; **Save** | **Save as new** | **Generate and download HTML**.
3. **Preview** — live student game for the selected bank word.

Activity names use modals (first Save / Save as new / pencil rename), not a permanent name field.

Word bank edits also have a dedicated page at **`/word-bank`** (nav: **Word bank**).

---

## 3. Entry and default draft

- Nav / home → `/wordle`
- SSR loads inventory, keyboard, and word bank from the DAL
- Default draft: length 3, first length-3 bank word, medium difficulty
- Unsaved draft until Save / Save as new

---

## 4. Teacher journeys

### A. Manage the word bank

From the builder:

1. Click **Add/edit words** → **Word bank** dialog (same CRUD as the full page).
2. Optional: **Open word bank** link → `/word-bank`.

From `/word-bank` or the dialog:

1. Click **Add word** (or pencil on a row).
2. Enter English label + phoneme sequence (text and/or palette). Must be 3, 4, or 5 phonemes.
3. **Save word** → `createWord` / `updateWord` server action; list refreshes; builder pickers stay current via `onWordsChange`.
4. Trash icon → confirm → `deleteWord`; activities that had that pick fall back if needed.

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
| Bank word english/phonemes edited | List updates; id stays the same UUID |
| Bank word deleted | Picker rematches by english or uses loaded snapshot fallback |
| Invalid editor input | Modal validation blocks Save word |

---

## 6. What this removed

- UI toggle **HCE corpus** / **Custom word entry**
- Activity-local “custom” word state / mode in signatures
- Hard-coded UI prefill lists as the runtime source of truth (seed data remains in DB + `data/` fixtures for migrations/tests)
- Inline full **Word bank** section on builders (replaced by **Add/edit words** modal + `/word-bank`)

---

## Related files

| Path | Role |
| --- | --- |
| `dal/reference.ts` | Word bank list + CRUD |
| `app/actions/words.ts` | Server actions for word bank |
| `app/word-bank/page.tsx` | Dedicated word bank page |
| `components/shared/WordBankModal.tsx` | Dialog shell for builders |
| `components/shared/WordBankManager.tsx` | Word bank UI (`page` / `embedded`) |
| `components/shared/WordBankEditor.tsx` | Add/edit modal |
| `components/wordle/WordleConfigForm.tsx` | Select-only configure |
| `components/wordle/WordleBuilder.tsx` | Orchestration without mode |
