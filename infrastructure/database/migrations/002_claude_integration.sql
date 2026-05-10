-- Claude AI Integration Tables

-- AI conversation sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  language VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, archived, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')), -- user or assistant
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track code modifications suggested by Claude
CREATE TABLE IF NOT EXISTS ai_code_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  file_path VARCHAR(1024) NOT NULL,
  original_code TEXT NOT NULL,
  suggested_code TEXT NOT NULL,
  explanation TEXT,
  changes JSONB DEFAULT '[]', -- Array of change descriptions
  status VARCHAR(20) DEFAULT 'suggested', -- suggested, accepted, rejected
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  applied_at TIMESTAMP
);

-- AI code suggestions and improvements
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(1024) NOT NULL,
  language VARCHAR(50) NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL, -- improvement, test-case, refactoring, etc
  suggestion_text TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
  is_actioned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actioned_at TIMESTAMP
);

-- Track Claude API usage for billing/monitoring
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- modify, analyze, generate-tests, etc
  model VARCHAR(50) DEFAULT 'claude-opus-4-1',
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER, -- Operation duration
  status VARCHAR(20) DEFAULT 'success', -- success, failed, timeout
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_code_changes_user_id ON ai_code_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_code_changes_status ON ai_code_changes(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at);

-- Trigger to update ai_conversations.updated_at
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_conversations_updated_at_trigger
BEFORE UPDATE ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_ai_conversations_updated_at();
