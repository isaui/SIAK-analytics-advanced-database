-- Enable Pure CDC for SIAK Database using logical decoding
-- This script runs after the main schema is created

-- Create extensions needed for CDC
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Create a publication for logical replication
CREATE PUBLICATION siak_publication FOR ALL TABLES;

-- Create a CDC replication slot - Automatically create the slot since we've set up WAL properly
DO $$
BEGIN
    -- Only create if it doesn't exist
    IF NOT EXISTS (SELECT * FROM pg_replication_slots WHERE slot_name = 'siak_cdc_slot') THEN
        -- Create a logical replication slot using wal2json plugin
        PERFORM pg_create_logical_replication_slot('siak_cdc_slot', 'wal2json');
        RAISE NOTICE 'Created replication slot: siak_cdc_slot';
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

-- Informative message
DO $$
BEGIN
    RAISE NOTICE 'Pure CDC setup complete! The database is now tracking changes via logical replication.';
    RAISE NOTICE 'You can query changes using: SELECT * FROM get_cdc_changes(''siak_cdc_slot'');';
END$$;
