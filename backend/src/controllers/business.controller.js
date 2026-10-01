import {
  brandMemoryService,
  creativeMemoryService,
  memoryLearningService,
  createBrandMemoryInputSchema,
  updateBrandMemoryInputSchema,
  createCreativeMemoryInputSchema,
} from '../memory/index.js';
import { ValidationError } from '../core/errors/AppError.js';

export const getBusinessMemory = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const userId = req.user.id;
    const { category, status, type } = req.query;

    const brandItems = await brandMemoryService.listMemoryItems(businessId, userId, {
      category,
      status,
      type,
    });

    const creativePatterns = await creativeMemoryService.listPatterns(businessId, userId, {
      category,
      status,
    });

    return res.json({
      success: true,
      data: {
        brandMemoryItems: brandItems,
        creativeMemoryItems: creativePatterns,
        total: brandItems.length + creativePatterns.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createBusinessMemoryItem = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const userId = req.user.id;

    // Check if creating brand memory or creative memory
    if (req.body.pattern) {
      const validated = createCreativeMemoryInputSchema.parse(req.body);
      const item = await creativeMemoryService.createPattern(businessId, userId, validated);
      return res.status(201).json({ success: true, data: item });
    }

    const validated = createBrandMemoryInputSchema.parse(req.body);
    const item = await brandMemoryService.createMemoryItem(businessId, userId, validated);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.name === 'ZodError') {
      return next(new ValidationError('Invalid memory payload', err.errors));
    }
    next(err);
  }
};

export const updateBusinessMemoryItem = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const memoryId = req.params.memoryId;
    const userId = req.user.id;

    const validated = updateBrandMemoryInputSchema.parse(req.body);
    const updated = await brandMemoryService.updateMemoryItem(businessId, userId, memoryId, validated);

    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return next(new ValidationError('Invalid memory update payload', err.errors));
    }
    next(err);
  }
};

export const archiveBusinessMemoryItem = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const memoryId = req.params.memoryId;
    const userId = req.user.id;
    const reason = req.body?.reason || 'Archived by user';

    const archived = await brandMemoryService.archiveMemoryItem(businessId, userId, memoryId, reason);

    return res.json({ success: true, data: archived });
  } catch (err) {
    next(err);
  }
};

export const approveBusinessMemoryCandidate = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const memoryId = req.params.memoryId;
    const userId = req.user.id;
    const { type, priority } = req.body || {};

    const approved = await memoryLearningService.approveCandidate({
      businessId,
      userId,
      memoryId,
      type,
      priority,
    });

    return res.json({ success: true, data: approved });
  } catch (err) {
    next(err);
  }
};

