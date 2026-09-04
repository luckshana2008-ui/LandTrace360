import { Network, Share2 } from 'lucide-react';

const RelationshipGraph = ({ land, owners, docs, cases, mortgages }) => {
    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Share2 size={24} color="var(--accent-color)" /> Entity Relationship Diagram (v2)
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                A visual representation of the land's current ecosystem mapping.
            </p>
            <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', minWidth: '800px', padding: '2rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>

                    {/* Land Node */}
                    <div style={{ padding: '1rem', background: 'var(--accent-color)', borderRadius: '8px', zIndex: 2 }}>
                        <strong>LAND:</strong> {land.id}
                    </div>

                    {/* Line */}
                    <div style={{ flex: 1, height: '4px', background: 'var(--accent-color)', margin: '0 -2px', zIndex: 1 }}></div>

                    {/* Owner Node */}
                    <div style={{ padding: '1rem', background: '#a855f7', borderRadius: '8px', zIndex: 2 }}>
                        <strong>OWNER:</strong> {land.owner}
                    </div>

                    {/* Vertical Split for Relations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginLeft: '3rem', position: 'relative' }}>
                        {/* Connectors */}
                        <div style={{ position: 'absolute', left: '-3rem', top: '20%', bottom: '20%', width: '4px', background: '#a855f7' }}></div>
                        <div style={{ position: 'absolute', left: '-3rem', top: '20%', width: '3rem', height: '4px', background: '#a855f7' }}></div>
                        <div style={{ position: 'absolute', left: '-3rem', top: '50%', width: '3rem', height: '4px', background: '#a855f7' }}></div>
                        <div style={{ position: 'absolute', left: '-3rem', bottom: '20%', width: '3rem', height: '4px', background: '#a855f7' }}></div>

                        <div style={{ padding: '0.75rem', background: 'var(--warning)', borderRadius: '8px' }}>
                            <strong>DOCS ({docs?.length || 0}):</strong> {docs && docs.length > 0 ? docs[0]?.type : 'None'}
                        </div>

                        <div style={{ padding: '0.75rem', background: 'var(--danger)', borderRadius: '8px' }}>
                            <strong>CASES ({cases?.length || 0}):</strong> {cases && cases.length > 0 ? cases[0]?.status : 'None'}
                        </div>

                        <div style={{ padding: '0.75rem', background: 'var(--success)', borderRadius: '8px' }}>
                            <strong>BANK ({mortgages?.length || 0}):</strong> {mortgages && mortgages.length > 0 ? mortgages[0]?.bank : 'None'}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
export default RelationshipGraph;
