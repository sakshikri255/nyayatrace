ALTER TABLE documents ADD COLUMN processing_error TEXT;
ALTER TABLE documents ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN file_hash TEXT;
CREATE UNIQUE INDEX documents_case_hash_idx ON documents (case_id, file_hash);