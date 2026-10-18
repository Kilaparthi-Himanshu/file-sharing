import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useAtom } from 'jotai';
import { chunkSizeAtom } from '@/app/Atoms/atoms';

const steps = [
    { label: '64 KiB', value: 64 * 1024 },
    { label: '128 KiB', value: 128 * 1024 },
    { label: '192 KiB', value: 192 * 1024 },
    { label: '256 KiB', value: 256 * 1024 },
    { label: '512 KiB', value: 512 * 1024 },
];

const DebugChunkSizeSlider = () => {
    const [chunkSize, setChunkSize] = useAtom(chunkSizeAtom);

    const selectedIndex = steps.findIndex(
        (step) => step.value === chunkSize
    );

    const handleChange = (value: number[]) => {
        setChunkSize(steps[value[0]].value);
        console.log(steps[value[0]].value);
    }

    return (
        <div className="h-full w-full">
            <span>Chunk Size</span>

            <Slider.Root
                className="relative mt-2 flex h-5 w-full touch-none select-none items-center"
                min={0}
                max={steps.length - 1}
                step={1}
                value={[selectedIndex === -1 ? 0 : selectedIndex]}
                onValueChange={handleChange}
            >
                <Slider.Track className="relative h-[5px] grow rounded-full bg-blue-800">
                    <Slider.Range className="absolute h-full rounded-full bg-white" />
                </Slider.Track>

                <Slider.Thumb
                    className="block size-4 rounded-full bg-white focus:outline-none"
                    aria-label="ACK Window Size"
                />
            </Slider.Root>

            <div className="relative mt-2 flex justify-between text-sm text-white lg:text-base">
                {steps.map((step) => (
                    <span key={step.label}>{step.label}</span>
                ))}
            </div>
        </div>
    );
}

export default DebugChunkSizeSlider;
