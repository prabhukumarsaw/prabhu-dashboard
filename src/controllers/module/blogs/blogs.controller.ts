import { Request, Response } from 'express';
import * as blogsService from '../../../services/module/blogs/blogs.service';

export async function list(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string | undefined;

    const result = await blogsService.listBlogs(tenantId, page, limit, search);
    res.json({
        success: true,
        data: result,
    });
}

export async function getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const blog = await blogsService.getBlogById(id, req.tenantId!);
    if (!blog) {
        res.status(404).json({ success: false, message: 'Blog not found' });
        return;
    }
    res.json({ success: true, data: { blog } });
}

export async function create(req: Request, res: Response): Promise<void> {
    const { title, content, isPublished, authorId } = req.body;

    const blog = await blogsService.createBlog({
        tenantId: req.tenantId!,
        authorId: authorId || 'system',
        title,
        content,
        isPublished,
    });
    res.status(201).json({ success: true, data: { blog } });
}

export async function update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const blog = await blogsService.updateBlog(id, req.tenantId!, req.body);
        res.json({ success: true, data: { blog } });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Blog not found or update failed' });
    }
}

export async function remove(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await blogsService.deleteBlog(id, req.tenantId!);
    res.json({ success: true, message: 'Blog deleted' });
}
