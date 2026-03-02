import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const databaseURL = process.env.dbURL as string // Data API > API URL
const databaseKEY = process.env.dbKEY as string // API Keys > Anon Key

const supabase = createClient(databaseURL, databaseKEY)

export default supabase;