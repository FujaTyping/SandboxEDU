import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";

// Body : JSON
const completeSchema = t.Object({
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

    .get("/:courseid", async ({ headers, set, jwt, params: { courseid } }) => {
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);

        if (!id) {
            set.status = 401;
            return "Unauthorized"
        }

        let { data: Users, error } = await supabase
            .from('Users')
            .select("*")
            .eq('id', id)

        if (!error) {
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
        }

        set.status = 401;
        return "Unauthorized"
    }, {
        headers: getUserHeaders
    })

    .post("/complete", async ({ body, set, jwt, headers }) => {
        const { id: cid } = body;
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);

        if (!id) {
            set.status = 401;
            return "Unauthorized"
        }

        let { data: Users, error } = await supabase
            .from('Users')
            .select("data")
            .eq('id', id)

        if (error) {
            set.status = 400;
            return error.message
        }

        let userData = Users[0].data || {}
        if (!userData.complete) {
            userData.complete = []
        }

        let { data: Courses, error: Cerror } = await supabase
            .from('Courses')
            .select("id")
            .eq('id', cid)

        if (Cerror) {
            set.status = 400;
            return Cerror.message
        }

        userData.complete.push(Courses[0].id)

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
        body: completeSchema,
        headers: getUserHeaders
    })