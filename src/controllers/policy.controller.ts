import { Request, Response } from 'express';
import * as policyService from '../services/policy.service';

export async function list(req: Request, res: Response): Promise<void> {
  const policies = await policyService.listPolicies(req.tenantId!);
  res.json({ success: true, data: { policies } });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const policy = await policyService.getPolicyById(req.params.id, req.tenantId!);
  if (!policy) {
    res.status(404).json({ success: false, message: 'Policy not found' });
    return;
  }
  res.json({ success: true, data: { policy } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, code, description, effect, priority, rules } = req.body;
  const policy = await policyService.createPolicy(req.tenantId!, {
    name,
    code,
    description,
    effect,
    priority,
    rules,
  });
  res.status(201).json({ success: true, data: { policy } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const policy = await policyService.updatePolicy(req.params.id, req.tenantId!, req.body);
  res.json({ success: true, data: { policy } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await policyService.deletePolicy(req.params.id, req.tenantId!);
  res.json({ success: true, message: 'Policy deleted' });
}
