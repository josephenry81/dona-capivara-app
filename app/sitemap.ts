import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://app.donacapivara.com.br';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1
        },
        {
            url: `${baseUrl}/#categorias`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8
        }
    ];
}
