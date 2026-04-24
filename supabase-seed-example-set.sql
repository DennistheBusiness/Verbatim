-- =====================================================
-- Seed example set for every new user
-- Run in Supabase SQL Editor after deploying schema
-- Prerequisites: supabase-add-flashcard-tracking.sql
--               supabase-add-content-sources.sql
-- =====================================================

-- 0. Clean up any "I Have a Dream" sets created by a previous version
DELETE FROM public.memorization_sets WHERE title = 'I Have a Dream';

-- 1. Seed function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.seed_example_set_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_set_id UUID := gen_random_uuid();
  v_tag_id UUID;
BEGIN
  -- Guard: skip if user already has this example set
  IF EXISTS (
    SELECT 1 FROM public.memorization_sets
    WHERE user_id = p_user_id AND title = 'Star Spangled Banner'
  ) THEN
    -- Ensure the Sample tag is linked even on repeat runs
    SELECT id INTO v_tag_id FROM public.tags
    WHERE user_id = p_user_id AND name = 'Sample';

    IF v_tag_id IS NOT NULL THEN
      INSERT INTO public.set_tags (set_id, tag_id)
      SELECT ms.id, v_tag_id
      FROM public.memorization_sets ms
      WHERE ms.user_id = p_user_id AND ms.title = 'Star Spangled Banner'
      ON CONFLICT DO NOTHING;
    END IF;

    RETURN;
  END IF;

  INSERT INTO public.memorization_sets (
    id, user_id, title, content, chunk_mode,
    progress, session_state, recommended_step,
    reviewed_chunks, marked_chunks, is_custom_chunked,
    created_from, audio_file_path, original_filename,
    created_at, updated_at
  ) VALUES (
    v_set_id,
    p_user_id,
    'Star Spangled Banner',
    E'Say, can you see\nBy the dawn''s early light/\nWhat so proudly we hailed\nAt the twilight''s last gleaming?/\nWhose broad stripes and bright stars\nThrough the perilous fight\nO''er the ramparts we watched\nWere so gallantly, yeah, streaming?/\nAnd the rockets'' red glare\nThe bombs bursting in air\nGave proof through the night\nThat our flag was still there/\nO say, does that star-spangled banner yet wave\nO''er the land of the free and the home of the brave/',
    'custom',
    '{"familiarizeCompleted":false,"reviewedChunks":[],"markedChunks":[],"encode":{"stage1Completed":false,"stage2Completed":false,"stage3Completed":false,"lastScore":null},"tests":{"firstLetter":{"bestScore":null,"lastScore":null},"fullText":{"bestScore":null,"lastScore":null},"audioTest":{"bestScore":null,"lastScore":null}}}'::jsonb,
    '{"currentStep":null,"currentChunkIndex":null,"currentEncodeStage":null,"lastVisitedAt":null}'::jsonb,
    'familiarize',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    'text',
    NULL,
    NULL,
    NOW(),
    NOW()
  );

  -- Insert 5 custom chunks (pre-split, matching the '/' delimiter above)
  INSERT INTO public.chunks (id, set_id, order_index, text) VALUES
    (gen_random_uuid(), v_set_id, 0, E'Say, can you see\nBy the dawn''s early light'),
    (gen_random_uuid(), v_set_id, 1, E'What so proudly we hailed\nAt the twilight''s last gleaming?'),
    (gen_random_uuid(), v_set_id, 2, E'Whose broad stripes and bright stars\nThrough the perilous fight\nO''er the ramparts we watched\nWere so gallantly, yeah, streaming?'),
    (gen_random_uuid(), v_set_id, 3, E'And the rockets'' red glare\nThe bombs bursting in air\nGave proof through the night\nThat our flag was still there'),
    (gen_random_uuid(), v_set_id, 4, E'O say, does that star-spangled banner yet wave\nO''er the land of the free and the home of the brave');

  -- Create "Sample" tag for this user (ignore if already exists)
  INSERT INTO public.tags (id, user_id, name)
  VALUES (gen_random_uuid(), p_user_id, 'Sample')
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Link the tag to the set
  SELECT id INTO v_tag_id FROM public.tags
  WHERE user_id = p_user_id AND name = 'Sample';

  INSERT INTO public.set_tags (set_id, tag_id)
  VALUES (v_set_id, v_tag_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function called after each new profile row
CREATE OR REPLACE FUNCTION public.handle_new_user_example_set()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.seed_example_set_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on profiles (fires after handle_new_user creates the profile row)
DROP TRIGGER IF EXISTS on_profile_created_seed_example ON public.profiles;
CREATE TRIGGER on_profile_created_seed_example
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_example_set();

-- 4. Backfill existing users (idempotent — guard in seed fn prevents duplicates)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_example_set_for_user(r.id);
  END LOOP;
END;
$$;
