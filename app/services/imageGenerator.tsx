import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

function loadFont() {
    const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansThai-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
        throw new Error(`Font not found at ${fontPath}`);
    }
    return fs.readFileSync(fontPath);
}

export async function generateInfographic(type: 'daily_top5' | 'trending_now', data: any[]) {
    try {
        console.log(`Generating infographic for ${type}...`);
        const fontData = loadFont();
        
        const isTop5 = type === 'daily_top5';
        const bgGradient = isTop5 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

        const icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        const colors = [
            'rgba(255, 215, 0, 0.2)',
            'rgba(192, 192, 192, 0.2)',
            'rgba(205, 127, 50, 0.2)',
            'rgba(100, 149, 237, 0.2)',
            'rgba(147, 112, 219, 0.2)',
        ];

        const template = (
            <div style={{
                display: 'flex',
                width: '1200px',
                height: '1200px',
                background: bgGradient,
                flexDirection: 'column',
                color: 'white',
                padding: '60px',
                fontFamily: 'Noto Sans Thai',
                boxSizing: 'border-box',
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '40px',
                    borderRadius: '24px',
                    marginBottom: '40px',
                }}>
                    <div style={{ fontSize: '72px', fontWeight: 'bold', marginBottom: '12px' }}>
                        {isTop5 ? '🏆 TOP 5' : '🔥 TRENDING'}
                    </div>
                    <div style={{ fontSize: '32px', opacity: 0.95, fontWeight: '500' }}>
                        {isTop5 ? 'ข่าวเด่นประจำวัน' : 'ข่าวที่กำลังฮิต'}
                    </div>
                    <div style={{ fontSize: '18px', opacity: 0.7, marginTop: '12px' }}>
                        📅 {new Date().toLocaleDateString('th-TH', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {data.slice(0, 5).map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            background: colors[index],
                            padding: '24px 28px',
                            borderRadius: '16px',
                            marginBottom: '14px',
                            border: index === 0 ? '2px solid rgba(255, 215, 0, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                            alignItems: 'center',
                        }}>
                            <div style={{ fontSize: '40px', marginRight: '20px', flexShrink: 0 }}>
                                {icons[index]}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '600', lineHeight: 1.3, flex: 1 }}>
                                {item.title?.substring(0, 75) || 'Untitled'}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '40px',
                    padding: '24px 32px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '16px',
                    fontSize: '18px',
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>📰 Auto News Ranking</div>
                    <div style={{ opacity: 0.8 }}>✨ AI-Powered</div>
                </div>
            </div>
        );

        console.log('Rendering SVG with satori...');
        const svg = await satori(template, {
            width: 1200,
            height: 1200,
            fonts: [
                {
                    name: 'Noto Sans Thai',
                    data: fontData,
                    weight: 400,
                    style: 'normal',
                },
            ],
        });

        console.log('Converting SVG to PNG with Resvg...');
        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: 1200 },
        });
        const pngBuffer = resvg.render().asPng();
        console.log(`PNG buffer size: ${pngBuffer.length} bytes`);

        const fileName = `${type}_${Date.now()}.png`;
        console.log(`Uploading to Supabase: ${fileName}`);
        
        const { error: uploadError } = await supabase
            .storage
            .from('post-images')
            .upload(fileName, pngBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('post-images')
            .getPublicUrl(fileName);

        console.log(`✅ Infographic generated: ${publicUrl}`);
        return publicUrl;

    } catch (error: any) {
        console.error("Infographic Generation Failed:", error.message);
        return null;
    }
}
