CREATE TYPE "public"."activity_type" AS ENUM('wordle', 'word_search');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "activity_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"show_hints" boolean NOT NULL,
	"max_attempts" integer,
	"seed" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_word_phonemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_word_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"ipa" text NOT NULL,
	"grapheme" text NOT NULL,
	"example" text NOT NULL,
	CONSTRAINT "activity_word_phonemes_word_position_uid" UNIQUE("activity_word_id","position")
);
--> statement-breakpoint
CREATE TABLE "activity_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"english" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "activity_words_activity_position_uid" UNIQUE("activity_id","position")
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
CREATE TABLE "word_phonemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"phoneme_id" uuid NOT NULL,
	CONSTRAINT "word_phonemes_word_position_uid" UNIQUE("word_id","position")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"english" text NOT NULL,
	"phoneme_length" integer NOT NULL,
	CONSTRAINT "words_slug_unique" UNIQUE("slug"),
	CONSTRAINT "words_phoneme_length_check" CHECK ("words"."phoneme_length" in (3, 4, 5))
);
--> statement-breakpoint
ALTER TABLE "activity_word_phonemes" ADD CONSTRAINT "activity_word_phonemes_activity_word_id_activity_words_id_fk" FOREIGN KEY ("activity_word_id") REFERENCES "public"."activity_words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_words" ADD CONSTRAINT "activity_words_activity_id_activity_configurations_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyboard_slots" ADD CONSTRAINT "keyboard_slots_phoneme_id_phonemes_id_fk" FOREIGN KEY ("phoneme_id") REFERENCES "public"."phonemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_phonemes" ADD CONSTRAINT "word_phonemes_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_phonemes" ADD CONSTRAINT "word_phonemes_phoneme_id_phonemes_id_fk" FOREIGN KEY ("phoneme_id") REFERENCES "public"."phonemes"("id") ON DELETE restrict ON UPDATE no action;