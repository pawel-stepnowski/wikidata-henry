
export function PersonInfo({ person, setSelected }: { person: Person | null, setSelected: (p: Person | null) => void })
{
    if (!person) return null;

    return (
        <div className='person-info'>
            <div>
                <div style={{ fontWeight: 600 }}>{person.label}</div>
                <div style={{ color: '#555' }}>Born: {person.birthYear}</div>
                <div style={{ color: '#555' }}>Lon/Lat: {person.coordinates[0].toFixed(3)}, {person.coordinates[1].toFixed(3)}</div>
                {person.id && (
                    <div style={{ marginTop: 6 }}>
                        <a href={`https://www.wikidata.org/wiki/${person.id}`} target="_blank" rel="noreferrer">Open on Wikidata</a>
                    </div>
                )}
            </div>
            <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
    );
}