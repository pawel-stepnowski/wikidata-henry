import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import readme from '../../README.md?raw';

export function AppInfo({ setInfoOpen }: { setInfoOpen: (open: boolean) => void })
{
    const element = (
        <div className="app-info-panel" role="dialog" aria-modal="true">
            <div className="app-info-header">
                <div className="app-info-title">About</div>
                <button className="app-close" onClick={() => setInfoOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="app-info-content markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
            </div>
        </div>
    );
    return element;
}