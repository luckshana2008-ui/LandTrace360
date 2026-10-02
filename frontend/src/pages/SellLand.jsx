import { useState, useEffect } from 'react';
import { Send, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../api';
import SellerDocumentManager from '../components/SellerDocumentManager';

const SellLand = () => {
    const [lands, setLands] = useState([]);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        land_id: '', location: '', area: '', land_type: 'Residential', expected_price: '', description: '', contact: '',
        house_on_land: '', house_details: '', well_borewell: '', water_facility: '', electricity_available: '',
        road_access: '', road_details: '', compound_wall: '', existing_building: '', existing_building_details: '',
        current_land_use: '', nearby_facilities: '', additional_details: ''
    });
    const [showAdditional, setShowAdditional] = useState(false);
    const [landDocuments, setLandDocuments] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands`).then(res => res.json()).then(setLands);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'land_id') {
            const selectedLand = lands.find(l => l.id === value);
            if (selectedLand) {
                setFormData({
                    ...formData,
                    land_id: value,
                    location: selectedLand.location,
                    area: selectedLand.area_sq_ft.toString(),
                    land_type: selectedLand.land_type
                });
                return;
            }
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check documents constraint
        const uploadedDocs = landDocuments.filter(d => d.is_uploaded);
        if (uploadedDocs.length === 0) {
            alert("Land document is required before this property can be published for sale.");
            return;
        }

        const hasVerified = uploadedDocs.some(d => d.verification === 'Verified' || d.verification === 'VERIFIED MATCH');
        const hasPending = uploadedDocs.some(d => d.verification === 'Pending' || d.verification === 'Pending Verification');

        if (!hasVerified) {
            if (hasPending) {
                alert("Document verification is still pending. The land cannot be published yet.");
                return;
            } else {
                alert("Document verification failed. Please upload a valid document.");
                return;
            }
        }

        fetch(`${API_BASE}/api/lands/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, expected_price: parseInt(formData.expected_price) })
        }).then(() => navigate('/available'));
    };

    return (
        <div>
            <h1 className="page-title">Announce Land for Sale</h1>
            <div className="glass-panel" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Basic Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Basic Details</h3>
                        <div>
                            <label>Select Land (Demo ID)</label>
                            <select name="land_id" value={formData.land_id} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }}>
                                <option value="">Select a Land</option>
                                {lands.map(l => <option key={l.id} value={l.id}>{l.id} - {l.location}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 250px' }}>
                                <label>Location</label>
                                <input type="text" name="location" value={formData.location} readOnly style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#aaa', cursor: 'not-allowed' }} />
                            </div>
                            <div style={{ flex: '1 1 250px' }}>
                                <label>Area (sq ft)</label>
                                <input type="text" name="area" value={formData.area} readOnly style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#aaa', cursor: 'not-allowed' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 250px' }}>
                                <label>Land Type</label>
                                <input type="text" name="land_type" value={formData.land_type} readOnly style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#aaa', cursor: 'not-allowed' }} />
                            </div>
                            <div style={{ flex: '1 1 250px' }}>
                                <label>Asking Price (₹)</label>
                                <input type="number" name="expected_price" value={formData.expected_price} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                            </div>
                        </div>
                        <div>
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', minHeight: '80px' }}></textarea>
                        </div>
                        <div>
                            <label>Demo Contact Information</label>
                            <input type="text" name="contact" value={formData.contact} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                        </div>
                    </div>

                    {/* Additional Property Features */}
                    <div>
                        <button type="button" onClick={() => setShowAdditional(!showAdditional)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0', fontWeight: 'bold' }}>
                            <PlusCircle size={18} /> {showAdditional ? 'Hide Additional Property Information' : 'Add Additional Property Information (Optional)'}
                        </button>
                    </div>

                    {showAdditional && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Additional Property Information</h3>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>Current Land Use</label>
                                    <select name="current_land_use" value={formData.current_land_use} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select an option</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Agricultural">Agricultural</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Industrial">Industrial</option>
                                        <option value="Vacant">Vacant</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>Compound Wall / Fencing</label>
                                    <select name="compound_wall" value={formData.compound_wall} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select Yes / No</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>House on Land</label>
                                    <select name="house_on_land" value={formData.house_on_land} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select Yes / No</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label>House Details</label>
                                    <input type="text" name="house_details" value={formData.house_details} onChange={handleChange} placeholder="e.g. 2 BHK single-floor house" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>Well / Borewell</label>
                                    <select name="well_borewell" value={formData.well_borewell} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select Yes / No</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label>Water Facility</label>
                                    <input type="text" name="water_facility" value={formData.water_facility} onChange={handleChange} placeholder="e.g. Borewell + municipal water" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>Road Access</label>
                                    <select name="road_access" value={formData.road_access} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select Yes / No</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label>Road Details</label>
                                    <input type="text" name="road_details" value={formData.road_details} onChange={handleChange} placeholder="e.g. 30 ft road" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 250px' }}>
                                    <label>Existing Building</label>
                                    <select name="existing_building" value={formData.existing_building} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">Select Yes / No</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label>Existing Building Details</label>
                                    <input type="text" name="existing_building_details" value={formData.existing_building_details} onChange={handleChange} placeholder="e.g. Needs renovation" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div>
                                <label>Electricity Available</label>
                                <select name="electricity_available" value={formData.electricity_available} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                    <option value="">Select Yes / No</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label>Nearby Facilities</label>
                                <input type="text" name="nearby_facilities" value={formData.nearby_facilities} onChange={handleChange} placeholder="e.g. School, hospital and bus stop nearby" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px' }} />
                            </div>

                            <div>
                                <label>Additional Property Details</label>
                                <textarea name="additional_details" value={formData.additional_details} onChange={handleChange} placeholder="e.g. Corner property suitable for residential construction" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '8px', minHeight: '80px' }}></textarea>
                            </div>
                        </div>
                    )}

                    {formData.land_id && (
                        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.5)' }}>
                            <h3 style={{ margin: 0, paddingBottom: '0.5rem', color: 'orange' }}>Mandatory Requirement</h3>
                            <p style={{ margin: '0.5rem 0 1rem 0' }}><strong>Land document is required to publish this property for sale.</strong></p>
                            <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 1rem 0' }}>
                                Document verification is a demonstration feature using project records and does not constitute legal verification.
                            </p>
                            <SellerDocumentManager landId={formData.land_id} onDocumentsChange={setLandDocuments} />
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                        Publish Announcement <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
export default SellLand;
