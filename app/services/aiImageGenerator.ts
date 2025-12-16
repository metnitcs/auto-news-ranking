import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateImageFromAI(type: 'daily_top5' | 'trending_now', newsItems: any[]) {
    try {
        console.log(`[AI Image] Generating image for ${type}...`);
        
        const isTop5 = type === 'daily_top5';
        
        // ตัดข้อความให้สั้น (max 50 chars per headline)
        const titles = newsItems.map((item, i) => {
            const title = item.title?.substring(0, 50) || 'News';
            return `${i + 1}. ${title}`;
        }).join('\n');
        
        const prompt = isTop5
            ? `Create a professional infographic image with these requirements:
- Title: "TOP 5 NEWS"
- Subtitle: "Today's Headlines"
- Background: Purple to blue gradient (135 degrees)
- Text color: White
- Layout: Numbered list (1-5) with short headlines below
- Headlines to display:
${titles}
- Style: Modern, clean, professional
- Size: 1200x1200px
- Font: Large, bold, easy to read
- Include footer: "Auto News Ranking"
- Make sure all text is fully visible and not cut off`
            : `Create a professional infographic image with these requirements:
- Title: "TRENDING NOW"
- Subtitle: "What's Hot"
- Background: Pink to red gradient (135 degrees)
- Text color: White
- Layout: Numbered list with short headlines below
- Headlines to display:
${titles}
- Style: Modern, clean, professional
- Size: 1200x1200px
- Font: Large, bold, easy to read
- Include footer: "Auto News Ranking"
- Make sure all text is fully visible and not cut off`;

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
                temperature: 0.7,
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
