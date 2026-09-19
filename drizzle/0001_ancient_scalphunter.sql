CREATE TABLE "corpus_word_phonemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corpus_word_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"phoneme_id" uuid NOT NULL,
	CONSTRAINT "corpus_word_phonemes_word_position_uid" UNIQUE("corpus_word_id","position")
);
--> statement-breakpoint
CREATE TABLE "corpus_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"english" text NOT NULL,
	"phoneme_length" integer NOT NULL,
	CONSTRAINT "corpus_words_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "keyboard_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"row" integer NOT NULL,
	"col" integer NOT NULL,
	"phoneme_id" uuid,
	CONSTRAINT "keyboard_slots_row_col_uid" UNIQUE("row","col")
);
--> statement-breakpoint
CREATE TABLE "phonemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ipa" text NOT NULL,
	"grapheme" text NOT NULL,
	"example" text NOT NULL,
	CONSTRAINT "phonemes_ipa_unique" UNIQUE("ipa")
);
--> statement-breakpoint
ALTER TABLE "corpus_word_phonemes" ADD CONSTRAINT "corpus_word_phonemes_corpus_word_id_corpus_words_id_fk" FOREIGN KEY ("corpus_word_id") REFERENCES "public"."corpus_words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corpus_word_phonemes" ADD CONSTRAINT "corpus_word_phonemes_phoneme_id_phonemes_id_fk" FOREIGN KEY ("phoneme_id") REFERENCES "public"."phonemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyboard_slots" ADD CONSTRAINT "keyboard_slots_phoneme_id_phonemes_id_fk" FOREIGN KEY ("phoneme_id") REFERENCES "public"."phonemes"("id") ON DELETE set null ON UPDATE no action;