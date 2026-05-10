import Anthropic from '@anthropic-ai/sdk';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

interface CodeModificationRequest {
  filePath: string;
  currentCode: string;
  prompt: string;
  language: string;
}

interface CodeModificationResult {
  sessionId: string;
  filePath: string;
  originalCode: string;
  modifiedCode: string;
  explanation: string;
  changes: string[];
  timestamp: string;
}

interface AIConversation {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context: {
    filePath: string;
    language: string;
    currentCode: string;
  };
}

const conversations = new Map<string, AIConversation>();

export class ClaudeAIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate code modifications based on user prompt
   */
  async generateCodeModification(
    request: CodeModificationRequest
  ): Promise<CodeModificationResult> {
    const sessionId = uuidv4();

    logger.info({
      msg: 'Claude code modification request',
      filePath: request.filePath,
      promptLength: request.prompt.length,
    });

    const systemPrompt = `You are an expert software engineer assistant. Your task is to modify code based on user requests.

When modifying code:
1. Preserve the overall structure and functionality
2. Maintain backward compatibility
3. Follow the existing code style
4. Add comments for complex changes
5. Ensure type safety (TypeScript/Rust)
6. Keep performance in mind

Provide:
1. The complete modified code (wrapped in \`\`\`language blocks)
2. A brief explanation of changes
3. Key modifications made (as a list)

Current file: ${request.filePath}
Language: ${request.language}`;

    const userMessage = `Please modify the following code according to this request:

${request.prompt}

Current code:
\`\`\`${request.language}
${request.currentCode}
\`\`\`

Provide the complete modified code with explanations.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract code from response
      const codeMatch = responseText.match(
        /```(?:typescript|rust|python|javascript|tsx|jsx)?\n([\s\S]*?)```/
      );
      const modifiedCode = codeMatch ? codeMatch[1].trim() : request.currentCode;

      // Extract explanation
      const explanationMatch = responseText.match(
        /^([\s\S]*?)(?=```|Key modifications|Changes made)/
      );
      const explanation = explanationMatch ? explanationMatch[1].trim() : responseText;

      // Extract changes
      const changesMatch = responseText.match(
        /(?:Key modifications|Changes made)[:\s]*([\s\S]*?)(?=```|$)/
      );
      const changesText = changesMatch ? changesMatch[1] : '';
      const changes = changesText
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter((line) => line.length > 0);

      const result: CodeModificationResult = {
        sessionId,
        filePath: request.filePath,
        originalCode: request.currentCode,
        modifiedCode,
        explanation,
        changes: changes.length > 0 ? changes : this.extractChanges(request.currentCode, modifiedCode),
        timestamp: new Date().toISOString(),
      };

      logger.info({
        msg: 'Claude modification completed',
        sessionId,
        changesCount: result.changes.length,
      });

      return result;
    } catch (error) {
      logger.error({
        msg: 'Claude API error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to generate code modification: ${error}`);
    }
  }

  /**
   * Start a multi-turn conversation for iterative modifications
   */
  async startConversation(
    filePath: string,
    language: string,
    currentCode: string
  ): Promise<string> {
    const sessionId = uuidv4();

    conversations.set(sessionId, {
      sessionId,
      messages: [],
      context: {
        filePath,
        language,
        currentCode,
      },
    });

    logger.info({
      msg: 'AI conversation started',
      sessionId,
      filePath,
    });

    return sessionId;
  }

  /**
   * Send a message in an ongoing conversation
   */
  async continueConversation(
    sessionId: string,
    userMessage: string
  ): Promise<{
    response: string;
    modifiedCode?: string;
    changes?: string[];
  }> {
    const conversation = conversations.get(sessionId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const { context, messages } = conversation;

    const systemPrompt = `You are an expert software engineer assistant helping modify code.
File: ${context.filePath}
Language: ${context.language}

Current code:
\`\`\`${context.language}
${context.currentCode}
\`\`\`

Help the user modify this code according to their requests. Be concise and clear.
If providing modified code, wrap it in \`\`\`${context.language} blocks.`;

    // Add user message to conversation
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

      // Add assistant response to conversation
      messages.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Check if response contains modified code
      const codeMatch = assistantMessage.match(
        /```(?:typescript|rust|python|javascript|tsx|jsx)?\n([\s\S]*?)```/
      );

      if (codeMatch) {
        context.currentCode = codeMatch[1].trim();
        const changes = this.extractChanges(context.currentCode, codeMatch[1].trim());

        return {
          response: assistantMessage,
          modifiedCode: context.currentCode,
          changes,
        };
      }

      return {
        response: assistantMessage,
      };
    } catch (error) {
      logger.error({
        msg: 'Claude conversation error',
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to continue conversation: ${error}`);
    }
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): AIConversation | undefined {
    return conversations.get(sessionId);
  }

  /**
   * End conversation and cleanup
   */
  endConversation(sessionId: string): void {
    conversations.delete(sessionId);
    logger.info({ msg: 'Conversation ended', sessionId });
  }

  /**
   * Analyze code for suggestions
   */
  async analyzeCode(filePath: string, language: string, code: string): Promise<string[]> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this ${language} code and provide 3-5 specific improvement suggestions. Format as a numbered list.

File: ${filePath}

Code:
\`\`\`${language}
${code}
\`\`\``,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const suggestions = text
        .split('\n')
        .filter((line) => line.match(/^\d+\./))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim());

      return suggestions;
    } catch (error) {
      logger.error({
        msg: 'Code analysis error',
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Generate test cases for code
   */
  async generateTests(
    filePath: string,
    language: string,
    code: string
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Generate comprehensive test cases for this ${language} code. Use appropriate testing framework.

File: ${filePath}

Code:
\`\`\`${language}
${code}
\`\`\`

Provide complete, runnable test code.`,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error({
        msg: 'Test generation error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to generate tests');
    }
  }

  /**
   * Extract changes between two code versions
   */
  private extractChanges(original: string, modified: string): string[] {
    const changes: string[] = [];

    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    if (originalLines.length !== modifiedLines.length) {
      changes.push(
        `Line count changed: ${originalLines.length} → ${modifiedLines.length} lines`
      );
    }

    // Find first difference
    for (let i = 0; i < Math.min(originalLines.length, modifiedLines.length); i++) {
      if (originalLines[i] !== modifiedLines[i]) {
        changes.push(`Modified around line ${i + 1}`);
        break;
      }
    }

    // Check for function/class additions
    const originalFuncs = original.match(/(?:function|class|export|const.*=>)/g) || [];
    const modifiedFuncs = modified.match(/(?:function|class|export|const.*=>)/g) || [];
    if (modifiedFuncs.length > originalFuncs.length) {
      changes.push(`Added ${modifiedFuncs.length - originalFuncs.length} new functions/classes`);
    }

    if (changes.length === 0) {
      changes.push('Code structure updated');
    }

    return changes;
  }
}

export const claudeAIService = new ClaudeAIService();
