-- Funeral notice input expansion
-- Adds the extra fields used by the mobile funeral notice creator.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS deceased_age integer,
  ADD COLUMN IF NOT EXISTS age_calculation_method text DEFAULT 'korean_year',
  ADD COLUMN IF NOT EXISTS death_date date,
  ADD COLUMN IF NOT EXISTS death_time time,
  ADD COLUMN IF NOT EXISTS deceased_gender text,
  ADD COLUMN IF NOT EXISTS religious_rite text,
  ADD COLUMN IF NOT EXISTS funeral_method text,
  ADD COLUMN IF NOT EXISTS casket_date date,
  ADD COLUMN IF NOT EXISTS casket_time time,
  ADD COLUMN IF NOT EXISTS burial_date date,
  ADD COLUMN IF NOT EXISTS burial_time time,
  ADD COLUMN IF NOT EXISTS burial_location text,
  ADD COLUMN IF NOT EXISTS secondary_burial_location text,
  ADD COLUMN IF NOT EXISTS primary_contact text,
  ADD COLUMN IF NOT EXISTS secondary_contact text,
  ADD COLUMN IF NOT EXISTS funeral_director text,
  ADD COLUMN IF NOT EXISTS funeral_home text,
  ADD COLUMN IF NOT EXISTS visitation_type text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS visitation_note text,
  ADD COLUMN IF NOT EXISTS parking_transport_info text,
  ADD COLUMN IF NOT EXISTS condolence_accounts jsonb DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_age_calculation_method_check'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_age_calculation_method_check
      CHECK (age_calculation_method IN ('korean_year', 'full_age'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_visitation_type_check'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_visitation_type_check
      CHECK (visitation_type IN ('available', 'after_time', 'family_only', 'decline'));
  END IF;
END;
$$;

COMMENT ON COLUMN events.birth_date IS 'Funeral notice deceased birth date used for age calculation.';
COMMENT ON COLUMN events.deceased_age IS 'Funeral notice deceased age calculated from birth and death dates.';
COMMENT ON COLUMN events.age_calculation_method IS 'Funeral age calculation method: korean_year or full_age.';
COMMENT ON COLUMN events.death_date IS 'Funeral notice date of death.';
COMMENT ON COLUMN events.death_time IS 'Funeral notice time of death.';
COMMENT ON COLUMN events.deceased_gender IS 'Funeral notice deceased gender.';
COMMENT ON COLUMN events.religious_rite IS 'Funeral religious rite such as Christian, Catholic, Buddhist, Confucian, or general.';
COMMENT ON COLUMN events.funeral_method IS 'Funeral method such as general funeral, family funeral, cremation and columbarium, or burial.';
COMMENT ON COLUMN events.casket_date IS 'Funeral casket ceremony date.';
COMMENT ON COLUMN events.casket_time IS 'Funeral casket ceremony time.';
COMMENT ON COLUMN events.burial_date IS 'Funeral procession date.';
COMMENT ON COLUMN events.burial_time IS 'Funeral procession time.';
COMMENT ON COLUMN events.burial_location IS 'Funeral burial, crematorium, or first destination after procession.';
COMMENT ON COLUMN events.secondary_burial_location IS 'Optional final resting place such as columbarium, arboretum burial, or family grave.';
COMMENT ON COLUMN events.primary_contact IS 'Primary funeral host contact phone number.';
COMMENT ON COLUMN events.secondary_contact IS 'Optional secondary funeral host contact phone number.';
COMMENT ON COLUMN events.funeral_director IS 'Optional funeral director name.';
COMMENT ON COLUMN events.funeral_home IS 'Funeral home name.';
COMMENT ON COLUMN events.visitation_type IS 'Funeral visitation option: available, after_time, family_only, or decline.';
COMMENT ON COLUMN events.visitation_note IS 'Optional free text visitation guidance.';
COMMENT ON COLUMN events.parking_transport_info IS 'Optional parking and public transportation guidance.';
COMMENT ON COLUMN events.condolence_accounts IS 'Optional condolence money accounts as JSON array.';
