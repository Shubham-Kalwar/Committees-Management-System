-- ============================================================
-- CommitteeOS — Production Data Cleanup Migration
-- Run this ONCE against your PostgreSQL database.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- STEP 1: Identify committees to delete (test/debug + duplicates)
-- ────────────────────────────────────────────────────────────

-- 1a. Create temp table of IDs to purge (test/debug names)
CREATE TEMP TABLE _committees_to_purge AS
SELECT committee_id FROM committee
WHERE LOWER(committee_name) LIKE '%debug%'
   OR LOWER(committee_name) LIKE '%repro%'
   OR LOWER(committee_name) LIKE '%test%'
   OR LOWER(committee_name) LIKE '%smoke%'
   OR LOWER(committee_name) LIKE '%extended%'
   OR LOWER(committee_name) LIKE '%demo%'
   OR LOWER(committee_name) LIKE '%fake%'
   OR LOWER(committee_name) LIKE '%sample%';

-- 1b. Add duplicate committees (keep lowest ID per name)
INSERT INTO _committees_to_purge (committee_id)
SELECT committee_id FROM committee
WHERE committee_id NOT IN (
    SELECT MIN(committee_id)
    FROM committee
    GROUP BY LOWER(TRIM(committee_name))
)
AND committee_id NOT IN (SELECT committee_id FROM _committees_to_purge);

-- ────────────────────────────────────────────────────────────
-- STEP 2: Cascade-delete dependent data for purged committees
-- ────────────────────────────────────────────────────────────

-- Delete attendance for events in purged committees
DELETE FROM attendance
WHERE event_id IN (
    SELECT event_id FROM events WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge)
);

-- Delete event QR sessions
DELETE FROM event_qr_session
WHERE event_id IN (
    SELECT event_id FROM events WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge)
);

-- Delete event feedback
DELETE FROM event_feedback
WHERE event_id IN (
    SELECT event_id FROM events WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge)
);

-- Delete event media
DELETE FROM event_media
WHERE event_id IN (
    SELECT event_id FROM events WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge)
);

-- Delete event registrations
DELETE FROM event_registrations
WHERE event_id IN (
    SELECT event_id FROM events WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge)
);

-- Delete events
DELETE FROM events
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- Delete tasks
DELETE FROM task
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- Delete announcements
DELETE FROM announcements
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- Delete committee memberships
DELETE FROM committee_membership
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- Delete roles referencing purged committees
UPDATE roles SET committee_id = NULL
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- ────────────────────────────────────────────────────────────
-- STEP 3: Delete the purged committees
-- ────────────────────────────────────────────────────────────

DELETE FROM committee
WHERE committee_id IN (SELECT committee_id FROM _committees_to_purge);

-- Cleanup temp table
DROP TABLE _committees_to_purge;

-- ────────────────────────────────────────────────────────────
-- STEP 4: Add UNIQUE constraint on committee_name (if missing)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_committee_name'
    ) THEN
        ALTER TABLE committee ADD CONSTRAINT uq_committee_name UNIQUE (committee_name);
        RAISE NOTICE 'Added UNIQUE constraint uq_committee_name';
    ELSE
        RAISE NOTICE 'UNIQUE constraint uq_committee_name already exists';
    END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- STEP 5: Seed clean professional committee data
-- ────────────────────────────────────────────────────────────

INSERT INTO committee (committee_name, faculty_incharge_name, committee_info)
SELECT v.committee_name, v.faculty_incharge_name, v.committee_info
FROM (VALUES
    ('Technical Committee', 'Dr. Namdeo Badhe', 'Organizes hackathons, coding competitions, and technical workshops.'),
    ('Cultural Committee', 'Prof. Monisha James', 'Manages cultural festivals, performances, and student activities.'),
    ('Sports Committee', 'Coach Suraj', 'Handles inter-college tournaments and sports events.'),
    ('Media & Design Committee', 'Mrs. Nidhi Bhavsar', 'Responsible for branding, photography, and digital media.'),
    ('Placement Coordination Cell', 'Dr. Jane Smith', 'Coordinates recruitment drives and placement training.'),
    ('NSS Committee', 'Dr. Rakesh Sharma', 'Leads social service and community engagement activities.'),
    ('Entrepreneurship Cell', 'Mr. Shubham Kalwar', 'Encourages startups, innovation, and entrepreneurship.')
) AS v(committee_name, faculty_incharge_name, committee_info)
WHERE NOT EXISTS (
    SELECT 1 FROM committee c WHERE LOWER(c.committee_name) = LOWER(v.committee_name)
);

-- ────────────────────────────────────────────────────────────
-- STEP 6: Verify results
-- ────────────────────────────────────────────────────────────

SELECT committee_id, committee_name, faculty_incharge_name, committee_info
FROM committee
ORDER BY committee_id;

COMMIT;
