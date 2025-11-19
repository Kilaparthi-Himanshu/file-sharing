'use client';

import { profileAtom } from '@/app/Atoms/atoms';
import { generateApiKey } from '@/app/functions/dashbaord/generateApiKey';
import { supabase } from '@/app/utils/supabase/client';
import { ApiKeyDataType, ApiUsageDataType } from '@/types/supabase_database.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import React, { useState } from 'react';
import { FaRegCopy } from "react-icons/fa";
import { useFormattedDate } from '@/app/utils/hooks/useFormattedDate';
import { IoMdRefresh } from 'react-icons/io';
import { deleteApiKey } from '@/app/functions/dashbaord/deleteApiKey';
import { notifySuccess } from '@/app/components/Alerts';
import { ApiUsageTable } from '@/app/components/Dashboard/ApiUsageTable';
import { LuRefreshCcw } from "react-icons/lu";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

export default function ApiKeys() {
    const [textisCopied, setTextIsCopied] = useState(false);
    const profile = useAtomValue(profileAtom);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [showAPiKey, setShowApiKey] = useState(false);

    const { data: apiKeyData, isLoading: apiKeyDataLoading } = useQuery({
        queryKey: ['api_key', profile?.user_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('user_id', profile!.user_id)
                .maybeSingle();

            if (error) throw error;
            return data as ApiKeyDataType;
        },
        enabled: !!profile?.user_id, // only run when user is known
        staleTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    });

    const { data: apiUsageData, isLoading: apiUsageDataLoading } = useQuery({
        queryKey: ['api_usage', profile?.user_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('api_usage')
                .select('*')
                .eq('user_id', profile!.user_id)
                .order('date', { ascending: false });

            if (error) throw error;
            console.log(data);
            return data as ApiUsageDataType;
        }
    });

    const handleCopy = () => {
        if (!apiKeyData?.api_key) return;
        setTextIsCopied(true);
        navigator.clipboard.writeText(apiKeyData.api_key);
        setTimeout(() => {
            setTextIsCopied(false);
        }, 2000);
    }

    const handleGenerate = async () => {
        setLoading(true);
        const res = await generateApiKey();
        if (res.status === 'success') {
            queryClient.invalidateQueries({ queryKey: ['api_key', profile?.user_id] });
        } else {
            console.error(res);
        }
        setLoading(false);
        notifySuccess({ message: "Generated New API Key Successfully!", time: 2500, hideProgressBar: false, className: 'text-center' });
    }

    const handleRegenerate = async () => {
        const res = await deleteApiKey(profile!.user_id);
        if (res.status === 'success') {
            queryClient.invalidateQueries({ queryKey: ['api_key', profile?.user_id] });
        } else {
            console.error(res);
        }
        handleGenerate();
    }

    const handleApiUsagerefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['api_usage', profile?.user_id] });
    }

    const isBusy = apiKeyDataLoading || apiUsageDataLoading || loading;
    const createdAtFormatted = useFormattedDate(apiKeyData?.created_at);

    return (
        <div className='w-full h-full flex flex-col items-center p-8 gap-8'>
            <span className='text-4xl font-semibold text-white'>API Keys</span>

            <div className='bg-neutral-950 w-full h-[80px] rounded-2xl flex flex-col border border-neutral-700 items-center justify-center'>
                <div className='flex flex-row gap-4 w-full p-4 items-center justify-center'>
                    <span className='flex-1 text-white text-lg font-semibold'>
                        BlinkShare API Key
                    </span>

                    {apiKeyData?.api_key && 
                        <div 
                            className='text-white bg-neutral-900 w-max h-full flex items-center justify-center rounded-lg border-2 border-neutral-600 transition-all active:scale-95 text-sm p-2'
                            onClick={() => setShowApiKey(!showAPiKey)}
                            title={`${showAPiKey ? 'Hide Api Key' : 'Show Api Key'}`}
                        >
                            {showAPiKey ? 
                                <FaEyeSlash size={25} /> 
                            : 
                                <FaEye size={22} />
                            }
                        </div>
                    }

                    <div className='flex-1 relative flex items-center gap-2'>
                        {apiKeyData?.api_key && 
                            <div className='absolute right-2 h-full flex items-center justify-center w-[60px]'>
                                <div 
                                    className='text-white bg-neutral-900 w-full h-[60%] flex items-center justify-center rounded-sm border border-neutral-500 transition-all active:scale-95 text-sm' 
                                    onClick={() => {
                                        !textisCopied && handleCopy();
                                    }}
                                    title='Copy API Key'
                                >
                                    {textisCopied ? 'Copied!' : <FaRegCopy size={18} />}
                                </div>
                            </div>
                        }

                        {apiKeyData?.api_key ? 
                            <input type={`${showAPiKey ? 'text' : 'password'}`} 
                                name='sessionId' 
                                className={`border-2 border-neutral-600 w-full h-12 rounded-lg flex items-center p-2 font-sans focus:outline-4 outline-neutral-700 focus:border-neutral-400 focus:border-2 transition-[outline,border] duration-[50ms,0ms] text-neutral-400`} 
                                defaultValue={apiKeyData.api_key} 
                                readOnly
                            />
                        :
                            <div className='w-full h-full flex items-center justify-center'>
                                <div 
                                    className='text-white bg-neutral-900 w-max px-4 h-[50px] flex items-center justify-center rounded-sm border border-neutral-500 transition-all active:scale-95 text-center text-lg font-semibold' 
                                    onClick={() => !isBusy && handleGenerate()}
                                >
                                    {isBusy ? 'Loading...' : 'Generate API Key'}
                                </div>
                            </div>
                        }
                    </div>

                    {apiKeyData?.api_key && 
                        <div 
                            className='text-white bg-neutral-900 w-max h-full flex items-center justify-center rounded-lg border-2 border-neutral-600 transition-all active:scale-95 text-sm p-2'
                            onClick={handleRegenerate}
                            title='Regenerate API Key'
                        >
                            <IoMdRefresh size={25} />
                        </div>
                    }
                </div>
            </div>

            <div className='bg-neutral-950 w-full flex-1 overflow-y-auto rounded-2xl flex flex-col border border-neutral-700 p-4 text-white text-lg gap-7'>
                <span className='w-full text-white text-lg font-semibold underline'>
                    API Details:
                </span>

                <div className='w-full flex items-center text-[16px]'>
                    <span className='text-neutral-300'>
                        <span className='text-white font-semibold'>
                            Created:
                        </span>
                        &nbsp;
                        {createdAtFormatted}
                    </span>
                </div>

                <span className='w-full text-white text-lg font-semibold underline flex items-center justify-between'>
                    API Usage:
                    <div 
                        className='text-white bg-neutral-900 w-max h-full flex items-center justify-center rounded-sm border-2 border-neutral-600 transition-all active:scale-95 text-sm p-1'
                        onClick={handleApiUsagerefresh}
                        title='Refresh Data'
                    >
                        <LuRefreshCcw size={20} />
                    </div>
                </span>

                <ApiUsageTable plan={profile?.plan} apiKeyData={apiKeyData} apiUsageData={apiUsageData} />
            </div>
        </div>
    );
}
