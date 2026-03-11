import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";
import verify from "../../lib/verify";
import ai from "../../lib/gemini";
import { z } from "zod";
import { model } from "../config.json"

enum difficulty {
    easy = "easy",
    medium = "medium",
    hard = "hard"
}

// Body : JSON
const generateQuizSchema = t.Object({
    id: t.String(),
    difficulty: t.Enum(difficulty)
})

const userHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

// Body : JSON
const quizCompleteSchema = t.Object({
    id: t.String(),
    correct: t.Number(),
    wrong: t.Number()
})

const generateNewQuizSchema = z.object({
    title: z.string().describe('ชื่อของข้อสอบ'),
    decs: z.string().describe('คำอธิบายเรื่องของข้อสอบ'),
    score: z.number().describe('คะแนนเต็ม'),
    difficulty: z.string().describe('ความยากของข้อสอบตามที่ผู้ใช้เลือกมา'),
    questions: z.array(z.object({
        title: z.string().describe('โจทย์คำถาม'),
        score: z.number().describe('คะแนนของคำถามนี้'),
        hint: z.string().describe('คำใบวิธีสำหรับตอบคำถาม'),
        key: z.number().describe('Index ของตัวเลือกที่ถูกต้อง'),
        answer: z.string().describe('คำตอบ และ อธิบายคำตอบอย่างละเอียด'),
        options: z.array(z.string()).length(4).describe('ตัวเลือก 4 ตัวเลือก ก,ข,ค,ง')
    }))
})

export default (app: ElysiaApp) => app
    .post("/generate", async ({ body, set }) => {
        const { id, difficulty } = body

        let { data: Courses, error } = await supabase
            .from('Courses')
            .select('title,decs,subject,class')
            .eq('id', id)

        if (error) {
            set.status = 400;
            return error.message
        }

        const courseData = Courses[0]

        try {
            const response = await ai.models.generateContent({
                model: `${model}`,
                contents: `สร้างข้อสอบสำหรับวิชา ${courseData.subject} ของระดับชั้น ม.${courseData.class} ระดับความนาก ${difficulty}
                ในหัวข้อ "${courseData.title}" โดยมีคำอธิบายดังนี้ ${courseData.decs}
                
                ${courseData.subject == "คณิตศาสตร์" && "โดยวิชาคณิตศาสตร์อยากให้เป็นโจทย์คำนวณแบบท้าทาย"}
                ขอให้คำตอบ และ ตัวเลือกตรงกัน
                คำตอบของคุณต้องเป็น JSON object ที่สอดคล้องกับ schema ที่ให้มาเท่านั้น`,
                config: {
                    responseMimeType: "application/json",
                    responseJsonSchema: generateNewQuizSchema.toJSONSchema()
                }
            });

            set.status = 200;
            return response.text;
        } catch (error: any) {
            set.status = 400;
            return error.message
        }
    }, {
        body: generateQuizSchema,
        headers: userHeaders,
        async beforeHandle({ set, headers, jwt }) {
            const payload = await jwt.verify(headers.authorization?.split(' ')[1]);
            if (!payload || !(await verify(payload.id))) {
                set.status = 401;
                return "Unauthorized"
            }
        }
    })

    .post("/complete", async ({ body, set, jwt, headers }) => {
        const { id, correct, wrong } = body;
        const { id: uid } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(uid, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.data || {}
        if (!userData.quiz) {
            userData.quiz = []
        }

        let { data: Courses, error: Cerror } = await supabase
            .from('Courses')
            .select("id,title,subject,class")
            .eq('id', id)

        if (Cerror) {
            set.status = 400;
            return Cerror.message
        }

        userData.quiz.push({
            ...Courses[0],
            correct,
            wrong
        })

        const { data, error: Uerror } = await supabase
            .from('Users')
            .update({ data: userData })
            .eq('id', uid)
            .select()

        if (Uerror) {
            set.status = 400;
            return Cerror.message
        }

        return data[0].data
    }, {
        body: quizCompleteSchema,
        headers: userHeaders
    })