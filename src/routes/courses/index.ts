import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";
import verify from "../../lib/verify";

// Body : JSON
const courseSchema = t.Object({
    id: t.String()
})

const getUserHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

export default (app: ElysiaApp) => app
    .get("/all", async ({ set }) => {
        let { data: Courses, error } = await supabase
            .from('Courses')
            .select('id,title,subject,class,by,thumbnailURL')

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return Courses
    })

    .get("/:courseid", async ({ set, params: { courseid } }) => {
        let { data: Courses, error } = await supabase
            .from('Courses')
            .select("*")
            .eq('id', courseid)

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return Courses[0]
    }, {
        headers: getUserHeaders,
        async beforeHandle({ set, headers, jwt }) {
            if (await !verify(await jwt.verify(headers.authorization?.split(' ')[1]))) {
                set.status = 401;
                return "Unauthorized"
            }
        }
    })

    .post("/enroll", async ({ body, set, jwt, headers }) => {
        const { id: cid } = body;
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.data || {}
        if (!userData.enroll) {
            userData.enroll = []
        }

        let { data: Courses, error: Cerror } = await supabase
            .from('Courses')
            .select("id,title,subject,class")
            .eq('id', cid)

        if (Cerror) {
            set.status = 400;
            return Cerror.message
        }

        userData.enroll.push(Courses[0])

        const { data, error: Uerror } = await supabase
            .from('Users')
            .update({ data: userData })
            .eq('id', id)
            .select()

        if (Uerror) {
            set.status = 400;
            return Cerror.message
        }

        return data[0].data
    }, {
        body: courseSchema,
        headers: getUserHeaders
    })

    .post("/complete", async ({ body, set, jwt, headers }) => {
        const { id: cid } = body;
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.data || {}
        if (!userData.complete) {
            userData.complete = []
        }

        let { data: Courses, error: Cerror } = await supabase
            .from('Courses')
            .select("id,title,subject,class")
            .eq('id', cid)

        if (Cerror) {
            set.status = 400;
            return Cerror.message
        }

        userData.complete.push(Courses[0])

        const { data, error: Uerror } = await supabase
            .from('Users')
            .update({ data: userData })
            .eq('id', id)
            .select()

        if (Uerror) {
            set.status = 400;
            return Cerror.message
        }

        return data[0].data
    }, {
        body: courseSchema,
        headers: getUserHeaders
    })