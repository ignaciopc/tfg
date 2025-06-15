import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('usuarios')
  .select('*')

console.log(data)
