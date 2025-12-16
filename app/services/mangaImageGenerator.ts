import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateMangaImage(newsItem: any, type: 'daily_top5' | 'trending_now' = 'daily_top5') {
    try {
        console.log(`[Manga] Generating manga comic for ${type}: ${newsItem.title}`);
        
        const headline = newsItem.title?.substring(0, 80) || 'News';
        const summary = newsItem.bullets?.[0]?.substring(0, 100) || '';

        const prompt = `Create a high-quality Japanese manga-style comic strip (vertical, 3 panels) based on this story.

SOURCE STORY (Thai): "${headline} - ${summary}"

*** INSTRUCTIONS FOR AI ***
1. ANALYZE the Thai story above.
2. AUTOMATELY TRANSLATE the key events into short English sentences.
3. GENERATE the image with specific "Bilingual Dialogue" in speech bubbles as follows:

Layout Requirements:
- Vertical strip, 3 equal panels.
- Colorful, vibrant Anime style.
- High text legibility.

--- PANEL BREAKDOWN ---

PANEL 1 (The Setup):
- Visual: Illustrate the beginning of the story.
- TEXT REQ: Create a speech bubble containing the Thai summary of the intro AND your English translation of it.
- Text format: "Thai Text / English Text"

PANEL 2 (The Action):
- Visual: Illustrate the main event/conflict.
- TEXT REQ: Create a speech bubble containing the Thai summary of the action AND your English translation of it.
- Text format: "Thai Text / English Text"

PANEL 3 (The Conclusion):
- Visual: Illustrate the result/ending.
- TEXT REQ: Create a speech bubble containing the Thai summary of the result AND your English translation of it.
- Text format: "Thai Text / English Text"

*** CRITICAL ***
- Ensure EVERY panel has bilingual text (Thai & English).
- Do not leave any bubble with only one language.
- Use the translation capability to ensure the English text matches the Thai context.
`;

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
                    
                    const fileName = `manga_${type}_${Date.now()}.png`;
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
