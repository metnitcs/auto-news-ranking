import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateImageFromAI(type: 'daily_top5' | 'trending_now', newsItems: any[]) {
    try {
        console.log(`[AI Image] Generating image for ${type}...`);
        
        const isTop5 = type === 'daily_top5';
        
        // ตัดข้อความให้สั้นมาก (max 40 chars)
        const titles = newsItems.map((item, i) => {
            const title = item.title?.substring(0, 40) || 'News';
            return `${i + 1}. ${title}`;
        }).join('\n');
        
        const prompt = isTop5
            ? `Create a professional news infographic image.
Title: TOP 5 NEWS
Subtitle: Today's Headlines

Headlines to display (keep them SHORT and READABLE):
${titles}

Design requirements:
- Background: Purple to blue gradient
- Text color: White
- Layout: Title at top, then numbered headlines (1-5), footer at bottom
- Font: Large, bold, VERY READABLE
- Size: 1200x1200px
- IMPORTANT: Make sure ALL text is FULLY VISIBLE and NOT CUT OFF
- IMPORTANT: Use larger font sizes to ensure readability
- Footer: "Auto News Ranking"
- Style: Modern, professional, clean`
            : `Create a professional news infographic image.
Title: TRENDING NOW
Subtitle: What's Hot

Headlines to display (keep them SHORT and READABLE):
${titles}

Design requirements:
- Background: Pink to red gradient
- Text color: White
- Layout: Title at top, then numbered headlines, footer at bottom
- Font: Large, bold, VERY READABLE
- Size: 1200x1200px
- IMPORTANT: Make sure ALL text is FULLY VISIBLE and NOT CUT OFF
- IMPORTANT: Use larger font sizes to ensure readability
- Footer: "Auto News Ranking"
- Style: Modern, professional, clean`;

        console.log(`[AI Image] Calling Gemini 3 Pro Image Preview...`);
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
                temperature: 0.6,
                maxOutputTokens: 2048,
            }
        });

        const result = response.response;
        
        if (result.candidates && result.candidates[0]?.content?.parts) {
            const parts = result.candidates[0].content.parts;
            
            for (const part of parts) {
                if (part.inlineData) {
                    console.log(`[AI Image] Image generated successfully`);
                    
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    
                    const fileName = `${type}_${Date.now()}.png`;
                    const { error: uploadError } = await supabase
                        .storage
                        .from('post-images')
                        .upload(fileName, imageBuffer, {
                            contentType: 'image/png',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('[AI Image] Upload error:', uploadError);
                        return null;
                    }

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('post-images')
                        .getPublicUrl(fileName);

                    console.log(`[AI Image] ✅ Image uploaded: ${publicUrl}`);
                    return publicUrl;
                }
            }
        }

        console.log(`[AI Image] No image data in response`);
        return null;

    } catch (error: any) {
        console.error("[AI Image] Generation failed:", error.message);
        return null;
    }
}
