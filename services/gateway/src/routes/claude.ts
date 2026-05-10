import { Router, Request, Response } from 'express';
import { claudeAIService } from '../services/claude-ai';
import { logger } from '../services/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const claudeRouter = Router();

/**
 * POST /api/claude/modify
 * Generate code modifications based on user prompt
 */
claudeRouter.post('/modify', async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, currentCode, prompt, language } = req.body;

    if (!filePath || !currentCode || !prompt || !language) {
      return res.status(400).json({
        error: 'Missing required fields: filePath, currentCode, prompt, language',
      });
    }

    // Validate code size (prevent abuse)
    if (currentCode.length > 50000) {
      return res.status(413).json({
        error: 'Code too large (max 50KB)',
      });
    }

    if (prompt.length > 5000) {
      return res.status(413).json({
        error: 'Prompt too long (max 5000 characters)',
      });
    }

    logger.info({
      msg: 'Claude modify request',
      userId: req.user?.id,
      filePath,
    });

    const result = await claudeAIService.generateCodeModification({
      filePath,
      currentCode,
      prompt,
      language,
    });

    res.json(result);
  } catch (error) {
    logger.error({
      msg: 'Claude modify error',
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to generate code modification',
      message: error instanceof Error ? error.message : undefined,
    });
  }
});

/**
 * POST /api/claude/conversation/start
 * Start a new multi-turn conversation
 */
claudeRouter.post('/conversation/start', async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, language, currentCode } = req.body;

    if (!filePath || !language || !currentCode) {
      return res.status(400).json({
        error: 'Missing required fields: filePath, language, currentCode',
      });
    }

    const sessionId = await claudeAIService.startConversation(filePath, language, currentCode);

    logger.info({
      msg: 'Claude conversation started',
      userId: req.user?.id,
      sessionId,
    });

    res.json({
      sessionId,
      message: 'Conversation started. Send prompts with this sessionId.',
    });
  } catch (error) {
    logger.error({
      msg: 'Conversation start error',
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to start conversation',
    });
  }
});

/**
 * POST /api/claude/conversation/message/:sessionId
 * Send message in ongoing conversation
 */
claudeRouter.post('/conversation/message/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    const conversation = claudeAIService.getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    const result = await claudeAIService.continueConversation(sessionId, message);

    res.json({
      sessionId,
      response: result.response,
      modifiedCode: result.modifiedCode,
      changes: result.changes,
      messageCount: (conversation.messages.length + 1) / 2, // pairs of messages
    });
  } catch (error) {
    logger.error({
      msg: 'Conversation message error',
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to continue conversation',
    });
  }
});

/**
 * GET /api/claude/conversation/:sessionId
 * Get conversation history
 */
claudeRouter.get('/conversation/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const conversation = claudeAIService.getConversation(sessionId);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    res.json({
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      context: conversation.context,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch conversation',
    });
  }
});

/**
 * DELETE /api/claude/conversation/:sessionId
 * End conversation
 */
claudeRouter.delete('/conversation/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    claudeAIService.endConversation(sessionId);

    res.json({
      message: 'Conversation ended',
      sessionId,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to end conversation',
    });
  }
});

/**
 * POST /api/claude/analyze
 * Analyze code for improvements
 */
claudeRouter.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, language, code } = req.body;

    if (!filePath || !language || !code) {
      return res.status(400).json({
        error: 'Missing required fields: filePath, language, code',
      });
    }

    const suggestions = await claudeAIService.analyzeCode(filePath, language, code);

    res.json({
      filePath,
      suggestions,
    });
  } catch (error) {
    logger.error({
      msg: 'Code analysis error',
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to analyze code',
    });
  }
});

/**
 * POST /api/claude/generate-tests
 * Generate test cases
 */
claudeRouter.post('/generate-tests', async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, language, code } = req.body;

    if (!filePath || !language || !code) {
      return res.status(400).json({
        error: 'Missing required fields: filePath, language, code',
      });
    }

    const testCode = await claudeAIService.generateTests(filePath, language, code);

    res.json({
      filePath,
      testCode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({
      msg: 'Test generation error',
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to generate tests',
    });
  }
});
