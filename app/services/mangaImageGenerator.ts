import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateMangaImage(newsItem: any) {
    try {
        console.log(`[Manga] Generating manga comic for: ${newsItem.title}`);
        
        const headline = newsItem.title?.substring(0, 80) || 'News';
        const summary = newsItem.bullets?.[0]?.substring(0, 100) || '';
        
        const prompt = `Create a Japanese manga-style comic strip image with these specifications:

Story: "${headline}"
Context: "${summary}"

Layout: 3 vertical panels (read top to bottom)
- Panel 1 (top): Introduce the situation/problem
- Panel 2 (middle): Show the action/development
- Panel 3 (bottom): Show the result/conclusion

Design requirements:
- Style: Colorful manga/anime art style (NOT black and white)
- Size: 600x900px (vertical orientation)
- Each panel: 600x300px
- Include speech bubbles with short text (in English or Thai)
- Use vibrant colors
- Include manga-style effects (speed lines, emphasis marks, etc.)
- Professional quality
- Make it engaging and easy to understand

The story should convey the news headline in a fun, visual way.`;

        console.log(`[Manga] Calling Gemini 3 Pro Image Preview...`);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
        
        const response = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048,
            }
        });

        const result = response.response;
        
        if (result.candidates && result.candidates[0]?.content?.parts) {
            const parts = result.candidates[0].content.parts;
            
            for (const part of parts) {
                if (part.inlineData) {
                    console.log(`[Manga] Comic generated successfully`);
                    
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    
                    const fileName = `manga_${Date.now()}.png`;
                    const { error: uploadError } = await supabase
                        .storage
                        .from('post-images')
                        .upload(fileName, imageBuffer, {
                            contentType: 'image/png',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('[Manga] Upload error:', uploadError);
                        return null;
                    }

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('post-images')
                        .getPublicUrl(fileName);

                    console.log(`[Manga] ✅ Manga comic uploaded: ${publicUrl}`);
                    return publicUrl;
                }
            }
        }

        console.log(`[Manga] No image data in response`);
        return null;

    } catch (error: any) {
        console.error("[Manga] Generation failed:", error.message);
        return null;
    }
}
