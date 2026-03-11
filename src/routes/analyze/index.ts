import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import verify from "../../lib/verify";
import { z } from "zod"
import ai from "../../lib/gemini";
import { model } from "../config.json"

const getUserHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

const analyzeSkillResponseSchema = z.object({
    reportTitle: z.string().describe('หัวข้อการรายงานทักษะ'),
    description: z.string().describe('รายละเอียดการรายงานทักษะ'),
    improve: z.string().describe('สิ่งที่ต้องการให้ผู้เรียนปรับปรุงเพิ่ม'),
    skills: z.array(z.object({
        skillName: z.string().describe('ชื่อทักษะ'),
        skillPoint: z.number().describe('ระดับความสามารถในวิชา').max(10)
    })).max(6).describe('รายการทักษะที่แสดงเป็นกราฟ')
})

interface userQuiz {
    id: string,
    title: string,
    subject: string,
    class: string,
    correct: number,
    wrong: number
}

export default (app: ElysiaApp) => app
    .post("/skills", async ({ body, set, jwt, headers }) => {
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.data || []

        if (userData.length == 0) {
            set.status = 400;
            return "No enough data";
        }

        let userQuizMsg = ""
        userData.quiz.map((item: userQuiz) => {
            userQuizMsg += `เนื้อหา ${item.title} ระดับชั้น ม.${item.class} ทำภูก ${item.correct} ข้อ และ ทำผิด ${item.wrong} ข้อ\n`
        })

        const response = await ai.models.generateContent({
            model: `${model}`,
            contents: `ช่วยวิเคาห์ข้อมูลผู้เรียนจากการทำแบบทดสอบ ของนักเรียน ${v.displayName} เพื่อจะได้นำมาแสดงเป็นกราฟ โดยมีข้อมูลดั้งนี้ ${userQuizMsg}
            
            หากวิชาไหนไม่มีข้อมูลให้ใส่ 0
            คำตอบของคุณต้องเป็น JSON object ที่สอดคล้องกับ schema ที่ให้มาเท่านั้น
            `,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: analyzeSkillResponseSchema.toJSONSchema()
            }
        });

        return response.text;
    }, {
        headers: getUserHeaders
    })