import { NextResponse } from 'next/server';
import { generateInfographic } from '@/services/imageGenerator';

export const maxDuration = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily_top5';

    // Mock data for testing
    const mockData = [
        {
            id: '1',
            title: 'นายกฯ เปิดนโยบายเศรษฐกิจดิจิทัล มุ่งสู่ Thailand 4.0',
            insight: 'รัฐบาลเร่งผลักดันนโยบายเศรษฐกิจดิจิทัล เพื่อยกระดับประเทศสู่ยุคใหม่',
            total_score: 95,
        },
        {
            id: '2',
            title: 'ราคาน้ำมันปรับลดลง 2 บาท มีผลตั้งแต่วันนี้',
            insight: 'ผู้บริโภคได้ประโยชน์จากการปรับลดราคาน้ำมันทุกชนิด',
            total_score: 88,
        },
        {
            id: '3',
            title: 'กรุงเทพฯ เตรียมเปิดรถไฟฟ้าสายสีเหลือง เชื่อมต่อ 3 เขต',
            insight: 'คาดว่าจะช่วยแก้ปัญหาการจราจรในกรุงเทพฯ ได้อย่างมีประสิทธิภาพ',
            total_score: 82,
        },
        {
            id: '4',
            title: 'ไทยติดอันดับ 10 ประเทศท่องเที่ยวยอดนิยมของโลก',
            insight: 'นักท่องเที่ยวต่างชาติแห่เที่ยวไทย หลังเปิดประเทศเต็มรูปแบบ',
            total_score: 78,
        },
        {
            id: '5',
            title: 'กระทรวงศึกษาธิการเตรียมปฏิรูปการศึกษาไทย',
            insight: 'มุ่งเน้นพัฒนาทักษะในศตวรรษที่ 21 และการเรียนรู้ตลอดชีวิต',
            total_score: 75,
        },
    ];

    try {
        console.log('Starting image generation with type:', type);
        console.log('Mock data:', mockData);
        
        const imageUrl = await generateInfographic(
            type as 'daily_top5' | 'trending_now',
            mockData
        );

        console.log('Generated image URL:', imageUrl);

        return NextResponse.json({
            success: true,
            imageUrl,
            message: 'Infographic generated successfully',
            type,
        });
    } catch (error: any) {
        console.error('Test image generation error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { 
                error: error.message || 'Failed to generate test image',
                details: error.stack,
                type: error.name
            },
            { status: 500 }
        );
    }
}
