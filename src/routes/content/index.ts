import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";
import verify from "../../lib/verify";
import ai from "../../lib/gemini";
import { NonJSONModel } from "../config.json"

const getUserHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

export default (app: ElysiaApp) => app
    .get("/summarize/:courseid", async ({ set, params: { courseid } }) => {
        let { data: Courses, error } = await supabase
            .from('Courses')
            .select("*")
            .eq('id', courseid)

        if (error) {
            set.status = 400;
            return error.message
        }

        const CourseData = Courses[0]

        try {
            const response = await ai.models.generateContent({
                model: `${NonJSONModel}`,
                contents: `ช่วยสรุปเนื้อหาเรื่อง ${CourseData.title} คำอธิบาย ${CourseData.decs} ในรายวิชา ${CourseData.subject} ระดับชั้น ม.${CourseData.ckass}
                ${CourseData == "คณิตศาสตร์" && "ในวิชาคณิตศาสตร์ให้ใช้ Mathjax ในการแสดงสูตรคณิตศาสตร์"}
                `
            });

            set.status = 200;
            return response.text;
        } catch (error: any) {
            set.status = 400;
            return error.message
        }
    }, {
        headers: getUserHeaders,
        async beforeHandle({ set, headers, jwt }) {
            if (await !verify(await jwt.verify(headers.authorization?.split(' ')[1]))) {
                set.status = 401;
                return "Unauthorized"
            }
        }
    })