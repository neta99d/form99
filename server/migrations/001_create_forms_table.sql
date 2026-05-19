-- Migration: 001_create_forms_table
-- Description: Creates the forms table for the dynamic form builder
-- Direction: up / down included below

-- ============================================================
-- UP
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS forms (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       TEXT        NOT NULL,
    title            TEXT        NOT NULL,
    description      TEXT,
    submit_button_text TEXT      NOT NULL,
    direction        VARCHAR(3)  NOT NULL,
    fields           JSONB       NOT NULL,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT forms_direction_check CHECK (direction IN ('ltr', 'rtl'))
);

-- ============================================================
-- DOWN
-- ============================================================

DROP TABLE IF EXISTS forms;
