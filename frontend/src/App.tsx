import { useState } from 'react';
import Map from './Map';
import { AppInfo } from './AppInfo';

export default function App()
{
    const [infoOpen, setInfoOpen] = useState(false);
    function handleReady()
    {
        document.body.classList.remove('loading');
    }
    const element =
    <>
        <div className="app-title">
            <button onClick={() => setInfoOpen(true)}>Occurrence of the name Henry</button>
            {infoOpen && <AppInfo setInfoOpen={setInfoOpen} />}
        </div>
        <Map onReady={handleReady} />
    </>;
    return element;
}
