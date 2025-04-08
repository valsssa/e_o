-- Create oracle_interactions table
CREATE TABLE IF NOT EXISTS oracle_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_oracle_interactions_user_id ON oracle_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_oracle_interactions_is_favorite ON oracle_interactions(is_favorite);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_oracle_interactions_updated_at
BEFORE UPDATE ON oracle_interactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create feedback table
CREATE TABLE IF NOT EXISTS oracle_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_id UUID NOT NULL REFERENCES oracle_interactions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_oracle_feedback_interaction_id ON oracle_feedback(interaction_id);

-- Create RLS policies for oracle_interactions
ALTER TABLE oracle_interactions ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own interactions
CREATE POLICY select_own_interactions ON oracle_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting own interactions
CREATE POLICY insert_own_interactions ON oracle_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating own interactions
CREATE POLICY update_own_interactions ON oracle_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for deleting own interactions
CREATE POLICY delete_own_interactions ON oracle_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for oracle_feedback
ALTER TABLE oracle_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own feedback
CREATE POLICY select_own_feedback ON oracle_feedback
  FOR SELECT
  USING (
    interaction_id IN (
      SELECT id FROM oracle_interactions WHERE user_id = auth.uid()
    )
  );

-- Policy for inserting own feedback
CREATE POLICY insert_own_feedback ON oracle_feedback
  FOR INSERT
  WITH CHECK (
    interaction_id IN (
      SELECT id FROM oracle_interactions WHERE user_id = auth.uid()
    )
  );

-- Policy for updating own feedback
CREATE POLICY update_own_feedback ON oracle_feedback
  FOR UPDATE
  USING (
    interaction_id IN (
      SELECT id FROM oracle_interactions WHERE user_id = auth.uid()
    )
  );

-- Policy for deleting own feedback
CREATE POLICY delete_own_feedback ON oracle_feedback
  FOR DELETE
  USING (
    interaction_id IN (
      SELECT id FROM oracle_interactions WHERE user_id = auth.uid()
    )
  );
