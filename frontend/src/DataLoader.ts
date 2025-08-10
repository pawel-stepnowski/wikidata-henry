
export class DataLoader
{
    async loadPersons(uri: string): Promise<Map<number, Person[]>>
    {
        const response = await fetch(uri);
        const text = await response.text();
        const data = text.split('\n').filter(Boolean).map(DataLoader.parsePerson).filter(Boolean) as Person[];
        const map = new Map<number, Person[]>();
        for (const item of data)
        {
            let year = map.get(item.birthYear);
            if (!year) map.set(item.birthYear, year = []);
            year.push(item);
        }
        return map;
    }
    
    static parsePerson(value: string): Person | undefined
    {
        const obj = JSON.parse(value);
        const year = parseInt(obj.birthDate?.match(/\+?(\d{4})/)?.[1]);
        let coordinates = obj.coordinates;
        if (obj.coordinates)
        {
            coordinates = [obj.coordinates.longitude, obj.coordinates.latitude];
        }
        if (obj.birthPlace && typeof obj.birthPlace.longitude === 'number' && typeof obj.birthPlace.latitude === 'number')
        {
            coordinates = [obj.birthPlace.longitude, obj.birthPlace.latitude];
        }
        if (!coordinates) return;
        const person =
        {
            id: obj.id,
            label: obj.label,
            birthYear: year,
            coordinates: coordinates as [number, number],
        };
        return person;
    }
}