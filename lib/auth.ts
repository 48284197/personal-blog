import { NextRequest } from 'next/server'
import { supabase } from './supabase'

export async function getRequestUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return user
}
