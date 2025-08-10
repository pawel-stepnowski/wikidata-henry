
type Person =
{
    id: string;
    label: string;
    birthYear: number;
    coordinates: [number, number];
    birthPlace?: { longitude: number; latitude: number; }
}