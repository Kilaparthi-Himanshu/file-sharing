'use server';

import { createClient } from "@/app/utils/supabase/server";
import bycrypt from "bcrypt";

export default async function revalidatePassword({ sessionId, password }: { sessionId: string, password: string }) {
    const supabase = await createClient();
    const { data: hashedPasswordData, error: hashedPasswordDataError } = await supabase
        .from('sessions')
        .select('password')
        .eq('id', sessionId )
        .single();

    if (hashedPasswordDataError)  return { status: 'error', message: 'Unable to Retrive Password' }

    const isMatch = await bycrypt.compare(password, hashedPasswordData.password);

    if (!isMatch) return { status: 'error', message: 'Wrong Password !' }

    return { status: 'success', message: 'Password Matched !' };
}