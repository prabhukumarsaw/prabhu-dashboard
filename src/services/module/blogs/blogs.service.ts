import { prismaBlogs } from '../../../lib/prisma-blogs';

export type CreateBlogInput = {
    tenantId: string;
    authorId: string;
    title: string;
    content: string;
    isPublished?: boolean;
};

export type UpdateBlogInput = Partial<{
    title: string;
    content: string;
    isPublished: boolean;
}>;

export async function createBlog(data: CreateBlogInput) {
    return prismaBlogs.blog.create({
        data: {
            tenantId: data.tenantId,
            authorId: data.authorId,
            title: data.title,
            content: data.content,
            isPublished: data.isPublished || false,
        },
    });
}

export async function updateBlog(blogId: string, tenantId: string, data: UpdateBlogInput) {
    return prismaBlogs.blog.update({
        where: { id: blogId, tenantId },
        data,
    });
}

export async function deleteBlog(blogId: string, tenantId: string) {
    return prismaBlogs.blog.deleteMany({
        where: { id: blogId, tenantId },
    });
}

export async function getBlogById(blogId: string, tenantId: string) {
    return prismaBlogs.blog.findFirst({
        where: { id: blogId, tenantId },
    });
}

export async function listBlogs(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [blogs, total] = await Promise.all([
        prismaBlogs.blog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaBlogs.blog.count({ where }),
    ]);

    return { blogs, total, page, limit };
}
