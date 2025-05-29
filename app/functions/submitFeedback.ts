'use server';

import { FeedbackTypes } from "@/app/components/Feedback/Feedback"
import { createClient } from "../utils/supabase/server";

type SubmitFeedbackTypes = {
    feedbackType: FeedbackTypes;
    title: string;
    description: string;
}

export default async function submitFeedback({ feedbackType, title, description}: SubmitFeedbackTypes) {
    const supabase = await createClient();

    const { error: feedbackError } = await supabase.from('feedbacks').insert([
        { feedback_type: feedbackType, title, description }
    ]);

    console.log(feedbackError);

    if (feedbackError) return { status: 'error', message: 'Unable To Submit Feedback!' }

    return { status: 'success', message: 'Feedback Submitted Successfully!' }
}