import { api } from '../../../lib/axios'
import type { Blog } from '../types'

export const cmsService = {
    getBlogs: async (): Promise<Blog[]> => {
        const res = await api.get('/cms/blogs')
        return res.data.data
    },
    createBlog: async (data: any): Promise<Blog> => {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images' && value instanceof FileList) {
                Array.from(value).forEach((file: any) => formData.append('images', file))
            } else if (value !== undefined && value !== null) {
                formData.append(key, value as string)
            }
        })
        const res = await api.post('/cms/blogs', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return res.data.data
    },
    updateBlog: async (id: string, data: any): Promise<Blog> => {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images' && value instanceof FileList) {
                Array.from(value).forEach((file: any) => formData.append('images', file))
            } else if (value !== undefined && value !== null) {
                formData.append(key, value as string)
            }
        })
        const res = await api.put(`/cms/blogs/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return res.data.data
    },
    deleteBlog: async (id: string): Promise<void> => {
        await api.delete(`/cms/blogs/${id}`)
    }
}
