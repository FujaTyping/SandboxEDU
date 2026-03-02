import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";

// Body : JSON
const createUserSchema = t.Object({
    name: t.String({ minLength: 2 }),
    surname: t.String({ minLength: 2 }),
    displayName: t.String({ minLength: 2 }),
    avatarURL: t.String(),
    class: t.Number(),
    room: t.Number()
})

const getUserHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

export default (app: ElysiaApp) => app
    .post("/create", async ({ body, set, jwt }) => {
        const { data, error } = await supabase
            .from('Users')
            .insert([
                {
                    name: body.name,
                    surname: body.surname,
                    displayName: body.displayName,
                    avatarURL: body.avatarURL,
                    class: body.class,
                    room: body.room
                },
            ])
            .select()

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return jwt.sign({
            id: data[0].id,
            displayname: data[0].displayName
        })
    }, {
        body: createUserSchema
    })

    .get("/get", async ({ headers, set, jwt }) => {
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);

        if (!id) {
            set.status = 401;
            return "Unauthorized"
        }

        let { data: Users, error } = await supabase
            .from('Users')
            .select("*")
            .eq('id', id)

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return Users[0]
    }, {
        headers: getUserHeaders
    })