'use client';

import * as React from "react";
import * as Slider from '@radix-ui/react-slider';
import { lifeTimeAtom } from "../Atoms/atoms";
import { useAtom } from "jotai";

const steps = ['30m', '1hr', '1.5hr', '2hr', '2.5hr', '3hr'];

const SliderTime = () => {
    const [lifeTime, setLifeTime] = useAtom(lifeTimeAtom);

    const handleChange = (value: number[]) => {
        setLifeTime(value[0]);
    }

	return (<div className="h-full w-full">
        <form>
            <Slider.Root
                className="relative flex h-5 touch-none select-none items-center w-full mt-2"
                defaultValue={[60]}
                value={[lifeTime]}
                min={30}
                max={180}
                step={30}
                onValueChange={handleChange}
            >
                <Slider.Track className="relative h-[5px] grow rounded-full bg-neutral-500">
                    <Slider.Range className="absolute h-full rounded-full bg-white" />
                </Slider.Track>
                <Slider.Thumb
                    className="block size-5 rounded-[10px] bg-white focus:shadow-[0_0_0_5px] focus:outline-none transition-all"
                    aria-label="Lifetime"
                />
            </Slider.Root>
	    </form>

        <div className="relative mt-2 flex justify-between text-sm text-white lg:text-[16px]">
            {steps.map((value) => (
                <span key={value} className="">
                    {value}
                </span>
            ))}
        </div>
    </div>)
};

export default SliderTime;