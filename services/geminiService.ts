
import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
    analysis: string;
    percentage: number;
}

export const analyzePersonality = async (
    name: string,
    answers: { score: number; trait: string }[]
): Promise<AnalysisResult> => {
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxScore = answers.length * 20;
    const calculatedPercentage = Math.round((totalScore / maxScore) * 100);

    const scoreDetails = answers.map(answer => `- ${answer.trait}: ${answer.score} คะแนน`).join('\n');

    const prompt = `
        คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ลักษณะนิสัย โปรดวิเคราะห์บุคลิกภาพของบุคคลชื่อ '${name}' จากคะแนนที่เขาได้รับในแต่ละหัวข้อคุณธรรม 5 ข้อ ดังนี้:
        ${scoreDetails}

        คะแนนเต็มในแต่ละหัวข้อคือ 20 คะแนน

        โปรดเขียนบทวิเคราะห์สั้นๆ (ไม่เกิน 3-4 ประโยค) ในเชิงบวก ให้กำลังใจ และสร้างสรรค์ เกี่ยวกับศักยภาพในการเป็นผู้นำและวีรบุรุษ/วีรสตรีของพวกเขา โดยอิงจากคะแนนที่ได้ และสรุปเป็นเปอร์เซ็นต์ความเป็นวีรชน

        โปรดตอบกลับในรูปแบบ JSON ตาม schema นี้เท่านั้น และไม่ต้องใส่ markdown backticks:
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: {
                            type: Type.STRING,
                            description: "บทวิเคราะห์ลักษณะนิสัยสั้นๆ เป็นภาษาไทย",
                        },
                        percentage: {
                            type: Type.INTEGER,
                            description: "เปอร์เซ็นต์ความเป็นวีรชน (คำนวณจากคะแนนรวม)",
                        },
                    },
                    required: ["analysis", "percentage"],
                },
            },
        });
        
        const textResponse = response.text.trim();
        const parsedResult = JSON.parse(textResponse) as AnalysisResult;
        
        // Use Gemini's percentage if available, otherwise use our calculation as a fallback.
        if (parsedResult.percentage === undefined) {
          parsedResult.percentage = calculatedPercentage;
        }

        return parsedResult;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback to a default response on error
        return {
            analysis: "เกิดข้อผิดพลาดในการวิเคราะห์ อย่างไรก็ตาม การที่คุณสนใจในคุณสมบัติเหล่านี้ก็เป็นก้าวแรกที่ยอดเยี่ยมสู่การเป็นคนที่ดีขึ้นแล้ว",
            percentage: calculatedPercentage,
        };
    }
};
