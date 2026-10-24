export interface Blog {
    id: string
    title: string
    slug: string
    author: string
    category: string
    status: 'Draft' | 'Published' | 'Archived'
    publishedAt?: string
    views: number
}

export interface FAQ {
    id: string
    question: string
    answer: string
    category: string
    status: 'Active' | 'Inactive'
    displayOrder: number
}
