import { useEffect, useState, useMemo } from 'react';
import MapLibre from 'maplibre-gl';
import { Map as ReactMapGL } from 'react-map-gl';
import type { MapLib } from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import TimeSlider from './TimeSlider';
import { DataLoader } from './DataLoader';
import { PersonInfo } from './PersonInfo';

const data_loader = new DataLoader();

export default function Map({ onReady }: { onReady?: () => void })
{
    const [data, setData] = useState(new globalThis.Map<number, Person[]>());
    const [range, setRange] = useState<[number, number]>([1500, 1550]);
    const [selected, setSelected] = useState<Person | null>(null);
    const [timeRange, setTimeRange] = useState({ min: 1200, max: 2025 });

    useEffect(() =>
    {
        async function loadData()
        {
            const data_url = 'people_with_coords.jsonl';
            const loaded = await data_loader.loadPersons(data_url);
            let min = Infinity;
            let max = -Infinity;
            for (const year of loaded.keys())
            {
                if (year < min) min = year;
                if (year > max) max = year;
            }
            setData(loaded);
            setTimeRange({ min, max });
            onReady?.();
        }
        loadData();
    },
    [onReady]);

    const filtered = useMemo(() =>
    {
        const items = [];
        for (let year = range[0]; year <= range[1]; year++)
        {
            items.push(...(data.get(year) ?? []));
        }
        return items;
    },
    [data, range]);

    useEffect(() =>
    {
        if (!selected) return;
        if (!filtered.includes(selected)) setSelected(null);
    },
    [filtered, selected]);

    const layer = useMemo(() =>
    {
        return new ScatterplotLayer
        ({
            id: 'scatter',
            data: filtered,
            getPosition: (d: Person) => d.coordinates,
            radiusUnits: 'pixels',
            getRadius: 6,
            getFillColor: () => [255, 0, 0, 180],
            autoHighlight: true,
            highlightColor: [0, 0, 0, 100],
            stroked: false,
            pickable: true,
        });
    },
    [filtered]);

    const selected_layer = useMemo(() => 
    {
        if (!selected) return null;
        return new ScatterplotLayer
        ({
            id: 'scatter-selected',
            data: [selected],
            getPosition: (d: Person) => d.coordinates,
            radiusUnits: 'pixels',
            getRadius: 6,
            getFillColor: () => [0, 120, 255, 200],
            stroked: true,
            getLineColor: [0, 0, 0, 255],
            lineWidthMinPixels: 2,
            pickable: false,
        });
    },
    [selected]);

    const element =
    <>
        <DeckGL
            initialViewState={{ latitude: 50, longitude: 10, zoom: 4 }}
            controller={true}
            layers={selected_layer ? [layer, selected_layer] : [layer]}
            pickingRadius={8}
            getCursor={({ isDragging, isHovering }) => {
                if (isDragging) return 'grabbing';
                return isHovering ? 'pointer' : 'grab';
            }}
            onClick={(info: PickingInfo) => 
            {
                const p = info?.object as Person | undefined;
                setSelected(p ?? null);
            }}
        >
            <ReactMapGL 
                /* @ts-expect-error maplibre-gl */
                mapLib={MapLibre as unknown as MapLib}
                mapStyle="https://demotiles.maplibre.org/style.json" />
        </DeckGL>
        {selected && <PersonInfo person={selected} setSelected={setSelected} />}
        <TimeSlider range={range} min={timeRange.min} max={timeRange.max} onChange={setRange} />
    </>;
    return element;
}
