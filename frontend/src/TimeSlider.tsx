import { useEffect, useRef, useState, useCallback } from 'react';
import type React from 'react';
import { Range, getTrackBackground } from 'react-range';

type DivPropsWithRef = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> };
type RenderTrackParams =
{
    props: DivPropsWithRef;
    children: React.ReactNode;
    isDragged?: boolean;
};
type RenderThumbParams =
{
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

    const mouse_start_x = useRef<number | null>(null);
    const range_at_drag_start = useRef<[number, number] | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Throttle parent onChange to avoid expensive map refresh on every mouse move
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    const pendingRange = useRef<[number, number] | null>(null);
    const throttleId = useRef<number | null>(null);
    const throttle_ms = 50; // ~20fps updates to parent

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
        throttle_ms);
    },
    []);

    useEffect(() =>
    {
        function onMouseMove(e: MouseEvent)
        {
            if (!isDraggingTrackRef.current || mouse_start_x.current === null || !range_at_drag_start.current) return;
            const delta_px = e.clientX - mouse_start_x.current;
            const rect = trackRef.current?.getBoundingClientRect();
            const track_width = rect?.width ?? 1;
            const total = max - min;
            const delta_years = Math.round((delta_px / track_width) * total);
            const [start0, end0] = range_at_drag_start.current;
            const width = end0 - start0;
            const new_start = Math.max(min, Math.min(max - width, start0 + delta_years));
            const new_end = new_start + width;
            const next: [number, number] = [new_start, new_end];
            setInternalRange(next);
            scheduleParentUpdate(next);
        }
        function onTouchMove(e: TouchEvent)
        {
            if (!isDraggingTrackRef.current || mouse_start_x.current === null || !range_at_drag_start.current) return;
            const t = e.touches[0];
            if (!t) return;
            const delta_px = t.clientX - mouse_start_x.current;
            const rect = trackRef.current?.getBoundingClientRect();
            const trackWidth = rect?.width ?? 1;
            const total = max - min;
            const delta_years = Math.round((delta_px / trackWidth) * total);
            const [start0, end0] = range_at_drag_start.current;
            const width = end0 - start0;
            const new_start = Math.max(min, Math.min(max - width, start0 + delta_years));
            const new_end = new_start + width;
            const next: [number, number] = [new_start, new_end];
            setInternalRange(next);
            scheduleParentUpdate(next);
            // Prevent page scroll while dragging
            e.preventDefault();
        }
        function onMouseUp()
        {
            if (!isDraggingTrackRef.current) return;
            setIsDraggingTrack(false);
            mouse_start_x.current = null;
            range_at_drag_start.current = null;
            // Ensure parent gets the final range
            onChange(internalRange);
        }
        function onTouchEnd()
        {
            if (!isDraggingTrackRef.current) return;
            setIsDraggingTrack(false);
            mouse_start_x.current = null;
            range_at_drag_start.current = null;
            onChange(internalRange);
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
        return () =>
        {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
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
                mouse_start_x.current = e.clientX;
                range_at_drag_start.current = internalRange;
                return; // Do NOT call react-range handler here
            }
            // Otherwise, let react-range perform its default behavior (jump/move nearest thumb)
            props.onMouseDown?.(e);
        };
        const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) =>
        {
            const target = e.target as Element | null;
            if (target && target.closest('[data-range-thumb="true"]'))
            {
                // Let react-range handle thumb touch gestures
                props.onTouchStart?.(e);
                return;
            }
            const rect = trackRef.current?.getBoundingClientRect();
            if (!rect)
            {
                props.onTouchStart?.(e);
                return;
            }
            const t = e.touches[0];
            if (!t) return;
            const total = max - min;
            const a = (internalRange[0] - min) / total * rect.width;
            const b = (internalRange[1] - min) / total * rect.width;
            const left = Math.min(a, b);
            const right = Math.max(a, b);
            const x = t.clientX - rect.left;
            const inside = x >= left && x <= right;
            if (inside)
            {
                e.preventDefault();
                setIsDraggingTrack(true);
                mouse_start_x.current = t.clientX;
                range_at_drag_start.current = internalRange;
                return;
            }
            props.onTouchStart?.(e);
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

    return <div {...props} ref={assignRef} style={style} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>{children}</div>;
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
