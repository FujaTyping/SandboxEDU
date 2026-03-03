import type { ElysiaApp } from "../../index";
import { t } from "elysia";
import supabase from "../../lib/supabase";
import verify from "../../lib/verify";

// Body : JSON
const createUserSchema = t.Object({
    name: t.String({ minLength: 2 }),
    surname: t.String({ minLength: 2 }),
    displayName: t.String({ minLength: 2 }),
    avatarURL: t.String(),
    sclass: t.Number(),
    room: t.Number()
})

const userHeaders = t.Object({
    authorization: t.String() // Bearer Token
})

// Body : JSON
const updateUserSchema = t.Object({
    value: t.String()
})

// Body : JSON
const revalidateSchema = t.Object({
    displayName: t.String()
})

export default (app: ElysiaApp) => app
    .post("/create", async ({ body, set, jwt }) => {
        const { name, surname, displayName, avatarURL, sclass, room } = body;

        let { data: Users, error: Cerror } = await supabase
            .from('Users')
            .select('displayName')
            .eq('displayName', displayName)

        if (Users?.length > 0) {
            set.status = 400;
            return "Already exists"
        }

        const { data, error } = await supabase
            .from('Users')
            .insert([
                {
                    name: name,
                    surname: surname,
                    displayName: displayName,
                    avatarURL: avatarURL,
                    class: sclass,
                    room: room
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

    .post("/revalidate", async ({ body, set, jwt }) => {
        const { displayName } = body;

        let { data: Users, error } = await supabase
            .from('Users')
            .select('*')
            .eq('displayName', displayName)

        if (error) {
            set.status = 400;
            return error.message
        }

        console.log(Users,error)
        set.status = 200;
        return jwt.sign({
            id: Users[0].id,
            displayname: Users[0].displayName
        })
    }, {
        body: revalidateSchema
    })

    .get("/get", async ({ headers, set, jwt }) => {
        const { id } = await jwt.verify(headers.authorization?.split(' ')[1]);
        const v = await verify(id, true);

        if (!v) {
            set.status = 401;
            return "Unauthorized"
        }

        set.status = 200;
        return v;
    }, {
        headers: userHeaders
    })

    .patch("/edit/:editfield", async ({ params: { editfield }, set, headers, jwt, body }) => {
        const id = await jwt.verify(headers.authorization?.split(' ')[1])
        const { value } = body;

        const { data, error } = await supabase
            .from('Users')
            .update({ [editfield]: value })
            .eq('id', id.id)
            .select()

        if (error) {
            set.status = 400;
            return error.message
        }

        set.status = 200;
        return data[0]
    }, {
        headers: userHeaders,
        body: updateUserSchema,
        async beforeHandle({ set, headers, jwt }) {
            if (await !verify(await jwt.verify(headers.authorization?.split(' ')[1]))) {
                set.status = 401;
                return "Unauthorized"
            }
        }
    })