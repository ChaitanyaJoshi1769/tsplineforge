# Claude AI Integration Guide

**Status**: ✅ Complete & Integrated
**Date**: 2025-05-10
**Version**: 1.0

---

## Overview

TSplineForge now includes AI-powered code generation via Claude. Users can:
- **Ask Claude to modify code** with natural language prompts
- **Have real-time conversations** about code changes
- **Review and accept/reject** suggested modifications
- **Generate tests** and improvements automatically
- **Analyze code** for optimization suggestions

---

## Features

### 1. Code Modification
Ask Claude to modify any file with a simple prompt:
```
"Add error handling to the curvature computation function"
"Optimize the remeshing algorithm for better performance"
"Add comprehensive unit tests"
```

### 2. Multi-turn Conversations
Have iterative conversations with Claude about your code:
```
User: "Make this function more efficient"
Claude: [Suggests improvements]
User: "But keep backward compatibility"
Claude: [Adjusts suggestion]
User: [Accepts or rejects]
```

### 3. Code Analysis
Get improvement suggestions for your code:
- Performance optimizations
- Refactoring opportunities
- Test coverage improvements
- Style and best practices

### 4. Test Generation
Automatically generate unit tests:
- Comprehensive test cases
- Edge case handling
- Mocking patterns
- Async/await patterns

---

## Architecture

### Backend Components

#### ClaudeAIService (`services/gateway/src/services/claude-ai.ts`)
```typescript
class ClaudeAIService {
  // Code modification
  async generateCodeModification(request): Promise<CodeModificationResult>
  
  // Conversations
  async startConversation(filePath, language, code): Promise<string>
  async continueConversation(sessionId, message): Promise<result>
  async getConversation(sessionId): AIConversation
  async endConversation(sessionId): void
  
  // Analysis
  async analyzeCode(filePath, language, code): Promise<string[]>
  async generateTests(filePath, language, code): Promise<string>
}
```

#### API Routes (`services/gateway/src/routes/claude.ts`)
```
POST   /api/claude/modify                    # One-shot modification
POST   /api/claude/conversation/start        # Start conversation
POST   /api/claude/conversation/message/:id  # Send message
GET    /api/claude/conversation/:id          # Get history
DELETE /api/claude/conversation/:id          # End conversation
POST   /api/claude/analyze                   # Code analysis
POST   /api/claude/generate-tests            # Test generation
```

### Frontend Components

#### AIAssistant Component (`apps/web/src/components/claude/AIAssistant.tsx`)
```typescript
interface AIAssistantProps {
  filePath: string;
  language: string;
  currentCode: string;
  onAcceptChange?: (newCode: string) => void;
  onClose?: () => void;
}
```

Features:
- Real-time chat interface
- Code change preview
- Accept/reject buttons
- Copy to clipboard
- Conversation history

### Database Schema

```sql
-- Conversation management
ai_conversations (
  id, user_id, session_id, file_path, 
  language, status, created_at, updated_at
)

-- Message history
ai_messages (
  id, conversation_id, role, content, 
  tokens_used, created_at
)

-- Track suggested changes
ai_code_changes (
  id, user_id, conversation_id, file_path,
  original_code, suggested_code, explanation,
  changes, status, created_at
)

-- Suggestions and improvements
ai_suggestions (
  id, user_id, file_path, language,
  suggestion_type, suggestion_text, priority,
  created_at
)

-- API usage tracking
ai_usage_log (
  id, user_id, operation_type, model,
  input_tokens, output_tokens, cost,
  duration_ms, status, created_at
)
```

---

## API Documentation

### Code Modification

**Endpoint**: `POST /api/claude/modify`

**Request**:
```bash
curl -X POST http://localhost:3000/api/claude/modify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "services/geometry-engine/src/curvature.rs",
    "language": "rust",
    "currentCode": "// Current code here",
    "prompt": "Add error handling and validate all inputs"
  }'
```

**Response**:
```json
{
  "sessionId": "uuid-string",
  "filePath": "services/geometry-engine/src/curvature.rs",
  "originalCode": "// Original code",
  "modifiedCode": "// Modified code",
  "explanation": "Added comprehensive error handling...",
  "changes": [
    "Added Result<T> return types",
    "Added input validation",
    "Added error variants"
  ],
  "timestamp": "2025-05-10T12:34:56Z"
}
```

### Start Conversation

**Endpoint**: `POST /api/claude/conversation/start`

**Request**:
```bash
curl -X POST http://localhost:3000/api/claude/conversation/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "apps/web/src/app/editor/page.tsx",
    "language": "typescript",
    "currentCode": "// Component code here"
  }'
```

**Response**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Conversation started. Send prompts with this sessionId."
}
```

### Continue Conversation

**Endpoint**: `POST /api/claude/conversation/message/:sessionId`

**Request**:
```bash
curl -X POST http://localhost:3000/api/claude/conversation/message/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you also add TypeScript type definitions?"
  }'
```

**Response**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "Sure! I've added comprehensive TypeScript types...",
  "modifiedCode": "// Updated code with types",
  "changes": [
    "Added interface definitions",
    "Added type annotations"
  ],
  "messageCount": 2
}
```

### Get Conversation

**Endpoint**: `GET /api/claude/conversation/:sessionId`

**Response**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "Make this more efficient"
    },
    {
      "role": "assistant",
      "content": "I can optimize by using..."
    }
  ],
  "context": {
    "filePath": "app.tsx",
    "language": "typescript",
    "currentCode": "// Current state"
  }
}
```

### Code Analysis

**Endpoint**: `POST /api/claude/analyze`

**Request**:
```bash
curl -X POST http://localhost:3000/api/claude/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "services/geometry-engine/src/curvature.rs",
    "language": "rust",
    "code": "// Code to analyze"
  }'
```

**Response**:
```json
{
  "filePath": "services/geometry-engine/src/curvature.rs",
  "suggestions": [
    "Consider using iterators instead of manual loops",
    "Add early return for edge cases",
    "Optimize memory allocation with pre-allocation"
  ]
}
```

### Generate Tests

**Endpoint**: `POST /api/claude/generate-tests`

**Request**:
```bash
curl -X POST http://localhost:3000/api/claude/generate-tests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "services/geometry-engine/src/curvature.rs",
    "language": "rust",
    "code": "// Implementation code"
  }'
```

**Response**:
```json
{
  "filePath": "services/geometry-engine/src/curvature.rs",
  "testCode": "#[cfg(test)]\nmod tests {\n  // Complete test suite\n}",
  "timestamp": "2025-05-10T12:34:56Z"
}
```

---

## Usage Examples

### Example 1: Single Modification Request

```typescript
// Frontend code
const response = await fetch('http://localhost:3000/api/claude/modify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filePath: 'src/geometry.rs',
    language: 'rust',
    currentCode: fs.readFileSync('src/geometry.rs', 'utf-8'),
    prompt: 'Add comprehensive error handling'
  })
});

const result = await response.json();
console.log('Changes:', result.changes);
console.log('Modified code:', result.modifiedCode);

// Accept changes
updateFile(result.filePath, result.modifiedCode);
```

### Example 2: Interactive Conversation

```typescript
// Start conversation
const startResp = await fetch('http://localhost:3000/api/claude/conversation/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    filePath: 'components/Editor.tsx',
    language: 'typescript',
    currentCode: editorCode
  })
});

const { sessionId } = await startResp.json();

// Send first message
const msg1 = await fetch(
  `http://localhost:3000/api/claude/conversation/message/${sessionId}`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: 'Add accessibility features' })
  }
);

const result1 = await msg1.json();

// Follow up
const msg2 = await fetch(
  `http://localhost:3000/api/claude/conversation/message/${sessionId}`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: 'Make sure it\'s WCAG 2.1 compliant' })
  }
);

const result2 = await msg2.json();
```

### Example 3: Using in CAD Editor

```typescript
// In editor component
import { AIAssistant } from '@/components/claude/AIAssistant';

export function EditorPage() {
  const [showAI, setShowAI] = useState(false);
  const [code, setCode] = useState(fileContent);

  return (
    <div>
      <button onClick={() => setShowAI(!showAI)}>
        {showAI ? 'Hide' : 'Ask Claude'}
      </button>
      
      {showAI && (
        <AIAssistant
          filePath="src/component.tsx"
          language="typescript"
          currentCode={code}
          onAcceptChange={(newCode) => {
            setCode(newCode);
            saveFile(newCode);
          }}
        />
      )}
    </div>
  );
}
```

---

## Environment Setup

### 1. Get Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create an account or log in
3. Generate an API key
4. Add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### 2. Install Dependencies

```bash
cd services/gateway
npm install @anthropic-ai/sdk
```

### 3. Start Services

```bash
docker-compose up -d
pnpm dev
```

### 4. Test Integration

```bash
# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test Claude endpoint
curl -X POST http://localhost:3000/api/claude/modify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test.ts",
    "language": "typescript",
    "currentCode": "const x = 1;",
    "prompt": "Add JSDoc comments"
  }'
```

---

## Limitations & Considerations

### Rate Limiting
- Default: 1000 requests per 15 minutes per user
- Customize in gateway: `express-rate-limit` config

### Cost Management
- Track tokens in `ai_usage_log` table
- Monitor usage per user
- Set budget alerts

### Security
- Validate API keys in `.env`
- Never expose keys in client code
- Sanitize user prompts
- Log all modifications

### Code Size Limits
- Max code size: 50KB
- Max prompt: 5000 characters
- Configurable in route handlers

---

## Monitoring & Analytics

### Track API Usage

```sql
-- Monthly usage per user
SELECT 
  user_id,
  COUNT(*) as request_count,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  SUM(cost) as total_cost
FROM ai_usage_log
WHERE created_at >= CURRENT_DATE - INTERVAL '1 month'
GROUP BY user_id
ORDER BY total_cost DESC;

-- Identify expensive operations
SELECT
  operation_type,
  AVG(total_tokens) as avg_tokens,
  COUNT(*) as usage_count,
  SUM(cost) as total_cost
FROM ai_usage_log
GROUP BY operation_type
ORDER BY total_cost DESC;
```

### Dashboard Metrics
- Total API calls per day
- Average tokens per operation
- Cost per user
- Success rate
- Error rate

---

## Best Practices

### For Users
1. **Be specific** - Clear, detailed prompts get better results
2. **Review changes** - Always review before accepting
3. **Use conversations** - Iterate for better results
4. **Save versions** - Keep backups before accepting changes

### For Developers
1. **Validate input** - Check all file paths and code size
2. **Handle errors** - Network issues are common
3. **Cache results** - Avoid redundant API calls
4. **Monitor costs** - Track token usage per user
5. **Test locally** - Validate with smaller files first

---

## Troubleshooting

### API Key Issues

**Error**: `401 Unauthorized`
- Check `ANTHROPIC_API_KEY` is set
- Verify key is valid (not expired)
- Ensure key has required permissions

### Conversation Errors

**Error**: `Conversation not found`
- Session may have expired (24 hour timeout)
- Start a new conversation
- Check session ID format

### Code Modification Errors

**Error**: `Code too large`
- File exceeds 50KB limit
- Split into smaller files
- Contact support for limit increase

### Rate Limiting

**Error**: `Too many requests`
- Wait 15 minutes
- Upgrade plan for higher limits
- Batch requests efficiently

---

## Future Enhancements

- [ ] Code review mode (Claude reviews your changes)
- [ ] Automated refactoring suggestions
- [ ] Performance optimization recommendations
- [ ] Security vulnerability scanning
- [ ] Documentation generation
- [ ] Migration assistance (React to Vue, etc.)
- [ ] Custom model fine-tuning
- [ ] Batch processing for large codebases

---

## Support

- **API Issues**: Check service logs: `docker-compose logs gateway`
- **Configuration**: See `.env.example`
- **Examples**: See `docs/CLAUDE_INTEGRATION.md`
- **Issues**: File GitHub issue with error details

---

**Claude integration is production-ready and fully integrated into TSplineForge!** 🚀
