import { Request, Response } from 'express';
import * as aclService from '../../services/core/acl.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { subjectType, subjectId, resourceType, resourceId } = req.query;
  const entries = await aclService.listACLEntries(req.tenantId!, {
    subjectType: subjectType as string,
    subjectId: subjectId as string,
    resourceType: resourceType as string,
    resourceId: resourceId as string,
  });
  res.json({ success: true, data: { entries } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { subjectType, subjectId, resourceType, resourceId, permission, conditions } = req.body;
  const entry = await aclService.createACLEntry({
    tenantId: req.tenantId!,
    subjectType,
    subjectId,
    resourceType,
    resourceId,
    permission,
    conditions,
  });
  res.status(201).json({ success: true, data: { entry } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await aclService.deleteACLEntry(req.params.id, req.tenantId!);
  res.json({ success: true, message: 'ACL entry deleted' });
}
