import { useEffect, useRef, useState, useCallback } from 'react';
import type React from 'react';
import { Range, getTrackBackground } from 'react-range';

type DivPropsWithRef = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> };
type RenderTrackParams = {
    props: DivPropsWithRef;
    children: React.ReactNode;
    isDragged?: boolean;
};
type RenderThumbParams = {
    props: DivPropsWithRef & { key?: React.Key };
    isDragged?: boolean;
    index?: number;
};

type TimeSliderProperties =
{
    range: [number, number];
    min: number;
    max: number;
    onChange: (range: [number, number]) => void;
};

export default function TimeSlider({ range, min, max, onChange }: TimeSliderProperties)
{
    // Internal state for instant UI response without forcing heavy parent updates each tick
    const [internalRange, setInternalRange] = useState<[number, number]>(range);
    useEffect(() =>
    {
        // Sync from parent when not actively dragging the track
        if (!isDraggingTrackRef.current) setInternalRange(range);
    },
    [range]);

    // Dragging the entire selected window across the track
    const [isDraggingTrack, setIsDraggingTrack] = useState(false);
    const isDraggingTrackRef = useRef(false);
    useEffect(() => { isDraggingTrackRef.current = isDraggingTrack; }, [isDraggingTrack]);

    const mouseStartX = useRef<number | null>(null);
    const rangeAtDragStart = useRef<[number, number] | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Throttle parent onChange to avoid expensive map refresh on every mouse move
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    const pendingRange = useRef<[number, number] | null>(null);
    const throttleId = useRef<number | null>(null);
    const throttleMs = 50; // ~20fps updates to parent
    const scheduleParentUpdate = useCallback((r: [number, number]) =>
    {
        pendingRange.current = r;
        if (throttleId.current != null) return;
        // fire leading
        onChangeRef.current(pendingRange.current);
        throttleId.current = window.setTimeout(() =>
        {
            throttleId.current = null;
            // trailing flush if user kept moving
            if (pendingRange.current) onChangeRef.current(pendingRange.current);
        },
        throttleMs);
    },
    []);

    useEffect(() =>
    {
        function onMouseMove(e: MouseEvent)
        {
            if (!isDraggingTrackRef.current || mouseStartX.current === null || !rangeAtDragStart.current) return;
            const deltaPx = e.clientX - mouseStartX.current;
            const rect = trackRef.current?.getBoundingClientRect();
            const trackWidth = rect?.width ?? 1;
            const total = max - min;
            const deltaYears = Math.round((deltaPx / trackWidth) * total);
            const [start0, end0] = rangeAtDragStart.current;
            const width = end0 - start0;
            const newStart = Math.max(min, Math.min(max - width, start0 + deltaYears));
            const newEnd = newStart + width;
            const next: [number, number] = [newStart, newEnd];
            setInternalRange(next);
            scheduleParentUpdate(next);
        }
        function onMouseUp()
        {
            if (!isDraggingTrackRef.current) return;
            setIsDraggingTrack(false);
            mouseStartX.current = null;
            rangeAtDragStart.current = null;
            // Ensure parent gets the final range
            onChange(internalRange);
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () =>
        {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    },
    [min, max, onChange, internalRange, scheduleParentUpdate]);

    function renderTrack({ props, children }: RenderTrackParams)
    {
        const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
        {
            // If the user started on a thumb, let react-range handle it
            const target = e.target as Element | null;
            if (target && target.closest('[data-range-thumb="true"]'))
            {
                props.onMouseDown?.(e);
                return;
            }
            const rect = trackRef.current?.getBoundingClientRect();
            if (!rect)
            {
                props.onMouseDown?.(e);
                return;
            }
            const total = max - min;
            const a = (internalRange[0] - min) / total * rect.width;
            const b = (internalRange[1] - min) / total * rect.width;
            const left = Math.min(a, b);
            const right = Math.max(a, b);
            const x = e.clientX - rect.left;
            const clickInsideSelected = x >= left && x <= right;

            if (clickInsideSelected)
            {
                // Start window drag only when clicking between thumbs (center)
                e.preventDefault();
                setIsDraggingTrack(true);
                mouseStartX.current = e.clientX;
                rangeAtDragStart.current = internalRange;
                return; // Do NOT call react-range handler here
            }
            // Otherwise, let react-range perform its default behavior (jump/move nearest thumb)
            props.onMouseDown?.(e);
        };

        // Compose our ref with react-range's internal ref to keep ResizeObserver working
        const assignRef = (el: HTMLDivElement | null) =>
        {
            trackRef.current = el as HTMLDivElement | null;
            const r = props.ref;
            if (typeof r === 'function') r(el);
            else if (r && typeof r === 'object') (r as React.MutableRefObject<HTMLDivElement | null>).current = el;
        };

        const style =
        {
            ...props.style,
            height: '6px',
            background: getTrackBackground({ values: internalRange, colors: ['#ccc', '#548BF4', '#ccc'], min, max }),
            margin: '0 16px',
            cursor: isDraggingTrack ? 'grabbing' : 'pointer',
        };

        return <div {...props} ref={assignRef} style={style} onMouseDown={onMouseDown}>{children}</div>;
    }

    function renderThumb({ props, index }: RenderThumbParams)
    {
        const style =
        {
            ...props.style,
            height: '20px',
            width: '20px',
            borderRadius: '50%',
            backgroundColor: '#548BF4',
        };
        return <div {...props} data-range-thumb="true" data-thumb-index={index} style={style} />;
    }

    const element =
    <div className='time-slider'>
        <Range
            values={internalRange}
            step={1}
            min={min}
            max={max}
            renderTrack={renderTrack}
            renderThumb={renderThumb}
            onChange={(values: number[]) =>
            {
                const next: [number, number] = [values[0], values[1]];
                setInternalRange(next);
                scheduleParentUpdate(next);
            }}
            onFinalChange={(values: number[]) =>
            {
                const next: [number, number] = [values[0], values[1]];
                setInternalRange(next);
                onChange(next);
            }}
        />
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>{internalRange[0]} – {internalRange[1]}</div>
    </div>;
    return element;
}
