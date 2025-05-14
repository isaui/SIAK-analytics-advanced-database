-- Enable Pure CDC for SIAK Database using logical decoding
-- This script runs after the main schema is created

-- Create extensions needed for CDC
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Ensure wal2json is available (some images already have it built-in)
SELECT * FROM pg_available_extensions WHERE name = 'wal2json';
-- If needed, uncomment: CREATE EXTENSION IF NOT EXISTS "wal2json";

-- Create a publication for logical replication
CREATE PUBLICATION siak_publication FOR ALL TABLES;

-- Drop existing slot if there's any issue with it
DO $$
BEGIN
    -- Check if slot exists but is in a potentially broken state
    IF EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'siak_cdc_slot') THEN
        BEGIN
            -- Try dropping it to ensure clean slate
            PERFORM pg_drop_replication_slot('siak_cdc_slot');
            RAISE NOTICE 'Dropped existing replication slot: siak_cdc_slot';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop slot, it might be in use';
        END;
    END IF;
END$$;

-- Create a CDC replication slot - Create it fresh even if dropped above
DO $$
BEGIN
    -- Only create if it doesn't exist
    IF NOT EXISTS (SELECT * FROM pg_replication_slots WHERE slot_name = 'siak_cdc_slot') THEN
        BEGIN
            -- Create a logical replication slot using wal2json plugin
            PERFORM pg_create_logical_replication_slot('siak_cdc_slot', 'wal2json');
            RAISE NOTICE 'Created replication slot: siak_cdc_slot';
        EXCEPTION WHEN OTHERS THEN
            -- Log the error to help debugging
            RAISE NOTICE 'Error creating replication slot: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Replication slot siak_cdc_slot already exists';
    END IF;
END$$;

-- Create helper function to easily consume CDC events
CREATE OR REPLACE FUNCTION get_cdc_changes(slot_name TEXT, upto_lsn pg_lsn = NULL, upto_nchanges INT = NULL, options TEXT[] = NULL)
RETURNS TABLE (change_json json) AS
$$
BEGIN
    RETURN QUERY SELECT json_build_object(
        'change', x.data::json,
        'lsn', x.lsn
    ) as change_json
    FROM pg_logical_slot_get_changes(slot_name, upto_lsn, upto_nchanges, options) x;
END;
$$ LANGUAGE plpgsql;

-- Verify replication slot is created and ready
DO $$
DECLARE
    slot_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'siak_cdc_slot') INTO slot_exists;
    
    IF slot_exists THEN
        RAISE NOTICE 'Pure CDC setup complete! The database is now tracking changes via logical replication.';
        RAISE NOTICE 'You can query changes using: SELECT * FROM get_cdc_changes(''siak_cdc_slot'');';
    ELSE
        RAISE WARNING 'CDC setup incomplete! The replication slot could not be created.';
        RAISE WARNING 'Please check that wal_level=logical is set and restart might be needed.';
    END IF;
END$$;
