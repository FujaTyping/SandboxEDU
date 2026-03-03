import supabase from "./supabase";

async function verify(id: string, data?: boolean) {
    if (!id) {
        return false
    }

    let { data: Users, error } = await supabase
        .from('Users')
        .select("*")
        .eq('id', id)

    if (error) {
        return false
    }

    if (data) {
        return Users[0]
    } else {
        return true
    }

}

export default verify;