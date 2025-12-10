import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

function loadFont() {
    const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansThai-Regular.ttf');
    return fs.readFileSync(fontPath);
}

function getRandomBackground(type: 'daily_top5' | 'trending_now'): string | null {
    const bgFolder = type === 'daily_top5' ? 'top5' : 'trending';
    const bgPath = path.join(process.cwd(), 'public/images/bg', bgFolder);
    
    if (!fs.existsSync(bgPath)) return null;
    
    const files = fs.readdirSync(bgPath).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    if (files.length === 0) return null;
    
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const imagePath = path.join(bgPath, randomFile);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(randomFile).slice(1);
    return `data:image/${ext};base64,${base64}`;
}

export async function generateInfographic(type: 'daily_top5' | 'trending_now', data: any[]) {
    try {
        console.log(`Generating infographic for ${type}...`);
        const fontData = await loadFont();
        
        const isTop5 = type === 'daily_top5';
        const bgImage = getRandomBackground(type);
        const bgGradient = isTop5 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

        const template = (
            <div style={{
                display: 'flex',
                width: '1200px',
                height: '1200px',
                position: 'relative',
            }}>
                {/* Background */}
                <div style={{
                    display: 'flex',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundImage: bgImage ? `url(${bgImage})` : bgGradient,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                }} />
                {/* Content */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    color: 'white',
                    padding: '60px',
                    fontFamily: 'Noto Sans Thai',
                    position: 'relative',
                }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(0, 0, 0, 0.85)',
                    padding: '35px',
                    borderRadius: '20px',
                    marginBottom: '45px',
                }}>
                    <div style={{ display: 'flex', fontSize: '64px', fontWeight: 'bold', marginBottom: '12px' }}>
                        {isTop5 ? 'TOP 5' : 'TRENDING'}
                    </div>
                    <div style={{ display: 'flex', fontSize: '28px', opacity: 0.95 }}>
                        {isTop5 ? 'ข่าวเด่นประจำวัน' : 'ข่าวที่กำลังฮิต'}
                    </div>
                    <div style={{ display: 'flex', fontSize: '18px', opacity: 0.8, marginTop: '8px' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                {/* News List */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.slice(0, 5).map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            background: 'rgba(0, 0, 0, 0.85)',
                            padding: '28px',
                            borderRadius: '16px',
                            marginBottom: '18px',
                            border: index === 0 ? '2px solid rgba(255, 215, 0, 0.6)' : 'none',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                background: index === 0 
                                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                                    : 'rgba(255, 255, 255, 0.35)',
                                color: index === 0 ? '#000' : '#fff',
                                width: '65px',
                                height: '65px',
                                borderRadius: '14px',
                                marginRight: '22px',
                            }}>
                                {index + 1}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', fontSize: '24px', fontWeight: 'bold', lineHeight: 1.4 }}>
                                    {item.title}
                                </div>
                                {item.insight && (
                                    <div style={{ display: 'flex', fontSize: '17px', opacity: 0.9, marginTop: '8px', lineHeight: 1.5 }}>
                                        {item.insight.substring(0, 90)}...
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '35px',
                    padding: '22px 28px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '14px',
                }}>
                    <div style={{ display: 'flex', fontSize: '19px', fontWeight: 'bold' }}>
                        Auto News Ranking
                    </div>
                    <div style={{ display: 'flex', fontSize: '16px', opacity: 0.85 }}>
                        AI-Powered Analysis
                    </div>
                </div>
                </div>
            </div>
        );

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
            loadAdditionalAsset: async (code: string, segment: string) => {
                if (code === 'emoji') {
                    return `data:image/svg+xml;base64,${btoa('<svg></svg>')}`;
                }
                return code;
            },
        });
        
        console.log('SVG generated successfully');
        console.log('SVG length:', svg.length);

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: 1200 },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        const fileName = `${type}_${Date.now()}.png`;
        const { error: uploadError } = await supabase
            .storage
            .from('post-images')
            .upload(fileName, pngBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
            .storage
            .from('post-images')
            .getPublicUrl(fileName);

        return publicUrl;

    } catch (error: any) {
        console.error("Infographic Generation Failed:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error; // Throw instead of return null to see the actual error
    }
}
