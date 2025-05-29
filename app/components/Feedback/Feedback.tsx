'use client';

import React, { useState } from 'react';
import { FaArrowRight } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import ShinyText from '../misc/ShinyText';
import FeedbackModalRenderer from './FeedbackModal';
import ModalRenderer from '../ModalRenderer';
import { ShareModal } from './ShareModal';

export type FeedbackTypes = 'feature' | 'suggestion';

export const Feedback = () => {
    const [feedbackType, setFeedbackType] = useState<FeedbackTypes>('feature');
    const [feedbackModalIsOpen, setFeedbackModalIsOpen] = useState(false);
    const [shareModalIsOpen, setShareModalIsOpen] = useState(false);

    const handleClick = (feature: FeedbackTypes) => {
        setFeedbackType(feature);
        setFeedbackModalIsOpen(true);
    }

    return (
        <div className='absolute bottom-0 right-0 text-white p-4 font-mono max-sm:right-auto'>
            <div className='flex flex-col items-end gap-4 max-sm:items-center max-sm:gap-2'>
                <button className='w-max flex gap-2 items-center text-xl max-sm:text-sm max-sm:font-semibold' onClick={() => handleClick('feature')}>
                    <ShinyText text={'Feature Request'} className='!text-[#dbdbdba4] relative after:bg-[#dbdbdba4] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:transition-transform after:duration-300 after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-100 after:ease-[cubic-bezier(0.65_0.05_0.36_1)]'/>
                    <FaArrowRight className='-rotate-45 text-[#dbdbdba4]' />
                </button>
                <button className='w-max flex gap-2 items-center text-xl max-sm:text-sm max-sm:font-semibold' onClick={() => handleClick('suggestion')}>
                    <ShinyText text={'Suggestion'} className='!text-[#dbdbdba4] relative after:bg-[#dbdbdba4] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:transition-transform after:duration-300 after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-100 after:ease-[cubic-bezier(0.65_0.05_0.36_1)]'/>
                    <FaArrowRight className='-rotate-45 text-[#dbdbdba4]' />
                </button>
                <button className='w-max flex gap-2 items-center text-xl max-sm:text-sm max-sm:font-semibold' onClick={() => setShareModalIsOpen(true)}>
                    <ShinyText text={'Share This Tool'} className='!text-[#dbdbdba4] relative after:bg-[#dbdbdba4] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:transition-transform after:duration-300 after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-100 after:ease-[cubic-bezier(0.65_0.05_0.36_1)]'/>
                    <IoMdShare className='text-[#dbdbdba4]' />
                </button>
                <span className='max-sm:text-xs'>
                    <ShinyText text={'Made with ❤️ by Himanshu'} className='!text-[#eeeeeea4]'/>
                </span>
            </div>
            <FeedbackModalRenderer feedbackType={feedbackType} isOpen={feedbackModalIsOpen} setIsOpen={setFeedbackModalIsOpen} />
            <ModalRenderer isOpen={shareModalIsOpen}>
                <ShareModal setIsOpen={setShareModalIsOpen} />
            </ModalRenderer>
        </div>
    );
}
