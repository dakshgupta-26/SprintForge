import CodeActivity, { CodeActionType, ICodeActivity } from '../models/CodeActivity';
import CodeDocumentVersion, { ICodeDocumentVersion } from '../models/CodeDocumentVersion';

export class CodeAuditService {
  /**
   * Logs a code action into the audit trail.
   */
  public static async logActivity(params: {
    projectId: string;
    userId: string;
    action: CodeActionType;
    file?: string;
    details?: string;
    metadata?: any;
  }): Promise<ICodeActivity> {
    return await CodeActivity.create({
      project: params.projectId,
      user: params.userId,
      file: params.file,
      action: params.action,
      details: params.details,
      metadata: params.metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Retrieves audit activity logs for a project with optional filters.
   */
  public static async getActivity(
    projectId: string,
    filters: {
      userId?: string;
      file?: string;
      action?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ activities: any[]; total: number }> {
    const query: any = { project: projectId };

    if (filters.userId) query.user = filters.userId;
    if (filters.file) query.file = filters.file;
    if (filters.action) query.action = filters.action;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      CodeActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar email role')
        .lean(),
      CodeActivity.countDocuments(query),
    ]);

    return { activities, total };
  }

  /**
   * Retrieves version history snapshots for a specific file.
   */
  public static async getFileVersions(
    projectId: string,
    file: string
  ): Promise<ICodeDocumentVersion[]> {
    return await CodeDocumentVersion.find({ project: projectId, file })
      .sort({ versionNumber: -1 })
      .limit(30)
      .populate('user', 'name avatar email')
      .lean();
  }

  /**
   * Retrieves a single version snapshot by ID.
   */
  public static async getVersionById(versionId: string): Promise<any> {
    return await CodeDocumentVersion.findById(versionId)
      .populate('user', 'name avatar email')
      .lean();
  }
}
