-- Migration: Add thumbnail_url column to resources table
-- Run this in Supabase SQL Editor

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Optional: create the thumbnails folder convention in the resources storage bucket
-- (This is handled client-side via uploads to resources/thumbnails/)
