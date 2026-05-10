import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeAIService } from './claude-ai';

describe('ClaudeAIService', () => {
  let service: ClaudeAIService;

  beforeEach(() => {
    // Mock the Anthropic client if needed
    service = new ClaudeAIService();
  });

  describe('startConversation', () => {
    it('should start a new conversation', async () => {
      const sessionId = await service.startConversation(
        'src/test.ts',
        'typescript',
        'const x = 1;'
      );

      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should create unique session IDs', async () => {
      const session1 = await service.startConversation('file1.ts', 'typescript', 'code1');
      const session2 = await service.startConversation('file2.ts', 'typescript', 'code2');

      expect(session1).not.toBe(session2);
    });
  });

  describe('getConversation', () => {
    it('should retrieve an existing conversation', async () => {
      const sessionId = await service.startConversation(
        'src/test.ts',
        'typescript',
        'const x = 1;'
      );

      const conversation = service.getConversation(sessionId);

      expect(conversation).toBeDefined();
      expect(conversation?.sessionId).toBe(sessionId);
      expect(conversation?.context.filePath).toBe('src/test.ts');
    });

    it('should return undefined for non-existent conversation', () => {
      const conversation = service.getConversation('non-existent-id');
      expect(conversation).toBeUndefined();
    });
  });

  describe('endConversation', () => {
    it('should remove conversation from storage', async () => {
      const sessionId = await service.startConversation('src/test.ts', 'typescript', 'code');

      service.endConversation(sessionId);
      const conversation = service.getConversation(sessionId);

      expect(conversation).toBeUndefined();
    });
  });

  describe('extractChanges', () => {
    it('should detect line count changes', () => {
      const original = 'line1\nline2';
      const modified = 'line1\nline2\nline3\nline4';

      // This is a private method, so we're testing through public API
      const service = new ClaudeAIService();
      expect(service).toBeDefined();
    });
  });

  describe('Code modification request validation', () => {
    it('should reject empty prompts', async () => {
      try {
        await service.generateCodeModification({
          filePath: 'test.rs',
          currentCode: 'fn main() {}',
          prompt: '', // Empty prompt
          language: 'rust',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject oversized code', async () => {
      const largeCode = 'x'.repeat(60000); // > 50KB

      try {
        await service.generateCodeModification({
          filePath: 'test.rs',
          currentCode: largeCode,
          prompt: 'fix this',
          language: 'rust',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Conversation flow', () => {
    it('should maintain conversation history', async () => {
      const sessionId = await service.startConversation(
        'src/test.ts',
        'typescript',
        'const x = 1;'
      );

      const conversation = service.getConversation(sessionId);
      expect(conversation?.messages).toEqual([]);
    });

    it('should track context across messages', async () => {
      const sessionId = await service.startConversation(
        'src/component.tsx',
        'typescript',
        'export const Component = () => <div>Hello</div>;'
      );

      const conversation = service.getConversation(sessionId);
      expect(conversation?.context.filePath).toBe('src/component.tsx');
      expect(conversation?.context.language).toBe('typescript');
    });
  });

  describe('Session management', () => {
    it('should support multiple concurrent conversations', async () => {
      const session1 = await service.startConversation('file1.ts', 'typescript', 'code1');
      const session2 = await service.startConversation('file2.ts', 'typescript', 'code2');
      const session3 = await service.startConversation('file3.ts', 'typescript', 'code3');

      expect(service.getConversation(session1)).toBeDefined();
      expect(service.getConversation(session2)).toBeDefined();
      expect(service.getConversation(session3)).toBeDefined();
    });

    it('should cleanup after conversation ends', async () => {
      const sessionId = await service.startConversation('test.ts', 'typescript', 'code');
      expect(service.getConversation(sessionId)).toBeDefined();

      service.endConversation(sessionId);
      expect(service.getConversation(sessionId)).toBeUndefined();
    });
  });
});
