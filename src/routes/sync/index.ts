import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";
import verify from "../../lib/verify";
import _ from "lodash"

// Body : JSON
const syncSchema = t.Object({
    data: t.String()
})

const getUserHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

export default (app: ElysiaApp) => app
    .post("/", async ({ body, set, jwt, headers }) => {
        const { data } = body;
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.sync_dat || {}

        if (_.isEqual(userData, JSON.parse(data))) {
            set.status = 200;
            return "Already synced"
        }

        const { data: Udata, error } = await supabase
            .from('Users')
            .update({ sync_dat: JSON.parse(data) })
            .eq('id', v.id)
            .select()

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return Udata[0].sync_dat
    }, {
        body: syncSchema,
        headers: getUserHeaders
    })

    .get("/data", async ({ set, jwt, headers }) => {
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true)

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        let userData = v.sync_dat || {}

        set.status = 200;
        return userData
    }, {
        headers: getUserHeaders
    })