import React, { useState, useEffect } from 'react';
import { PlusCircle, FileText, Trash2, Edit2, Download, Eye, AlertCircle } from 'lucide-react';
import API_BASE from '../api';

const SellerDocumentManager = ({ landId, onDocumentsChange }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentDocId, setCurrentDocId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        document_type: 'Sale Deed',
        document_name: '',
        document_number: '',
        issue_date: '',
        notes: ''
    });
    const [file, setFile] = useState(null);

    const docTypes = ['Sale Deed', 'Patta', 'Encumbrance Certificate (EC)', 'FMB / Survey Document', 'Property Tax Receipt', 'Other'];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    useEffect(() => {
        if (landId) {
            fetchDocuments();
        }
    }, [landId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/lands/${landId}/documents`);
            const data = await res.json();
            // Filter only uploaded by seller, or render all and conditionally allow edit
            // For seller management, we show all, but can only manage 'is_uploaded'
            setDocuments(data);
            if (onDocumentsChange) {
                onDocumentsChange(data);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch documents.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Invalid file type. Please upload PDF, JPG, or PNG.');
                setFile(null);
                e.target.value = '';
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size exceeds 5MB limit.');
                setFile(null);
                e.target.value = '';
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const openForm = (doc = null) => {
        setError('');
        setSuccess('');
        setFile(null);
        if (doc) {
            setEditMode(true);
            setCurrentDocId(doc.id);
            setFormData({
                document_type: doc.type || 'Other',
                document_name: doc.document_name || '',
                document_number: doc.doc_no || '',
                issue_date: doc.date || '',
                notes: doc.notes || ''
            });
        } else {
            setEditMode(false);
            setCurrentDocId(null);
            setFormData({
                document_type: 'Sale Deed',
                document_name: '',
                document_number: '',
                issue_date: '',
                notes: ''
            });
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditMode(false);
        setCurrentDocId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!editMode && !file) {
            setError('Please select a file to upload.');
            return;
        }

        if (!formData.document_name.trim()) {
            setError('Document Name is required.');
            return;
        }

        const data = new FormData();
        data.append('document_type', formData.document_type);
        data.append('document_name', formData.document_name);
        if (formData.document_number) data.append('document_number', formData.document_number);
        if (formData.issue_date) data.append('issue_date', formData.issue_date);
        if (formData.notes) data.append('notes', formData.notes);
        if (file) data.append('file', file);

        try {
            setLoading(true);
            let response;
            if (editMode) {
                response = await fetch(`${API_BASE}/api/documents/${currentDocId}`, {
                    method: 'PUT',
                    body: data
                });
            } else {
                response = await fetch(`${API_BASE}/api/lands/${landId}/documents`, {
                    method: 'POST',
                    body: data
                });
            }

            const result = await response.json();
            if (response.ok) {
                setSuccess(editMode ? 'Document updated successfully.' : 'Document uploaded successfully.');
                closeForm();
                fetchDocuments();
            } else {
                setError(result.detail || 'Failed to save document.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred during submission.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/documents/${docId}`, { method: 'DELETE' });
            if (response.ok) {
                setSuccess('Document deleted successfully.');
                fetchDocuments();
            } else {
                setError('Failed to delete document.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while deleting.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (docId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/documents/${docId}/verify`, { method: 'POST' });
            if (response.ok) {
                setSuccess('Document verified successfully (Demo).');
                fetchDocuments();
            } else {
                setError('Failed to verify document.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while verifying.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return 'status-badge status-info';
        const s = status.toLowerCase();
        if (s.includes('verified')) return 'status-badge status-success';
        if (s.includes('pending') || s.includes('under review')) return 'status-badge status-warning';
        if (s.includes('rejected') || s.includes('disputed')) return 'status-badge status-danger';
        return 'status-badge status-info';
    };

    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Land Document Records
                </h3>
                {!showForm && (
                    <button type="button" onClick={() => openForm()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                        <PlusCircle size={16} /> Add Document
                    </button>
                )}
            </div>

            {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {error}</div>}
            {success && <div style={{ background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}

            {showForm && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{editMode ? 'Update Document' : 'Upload New Document'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Document Type *</label>
                                <select name="document_type" value={formData.document_type} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }}>
                                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 300px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Document Name *</label>
                                <input type="text" name="document_name" value={formData.document_name} onChange={handleInputChange} placeholder="e.g. Primary Sale Deed" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Document Number (Optional)</label>
                                <input type="text" name="document_number" value={formData.document_number} onChange={handleInputChange} placeholder="e.g. DOC-123456" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
                            </div>
                            <div style={{ flex: '1 1 300px' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Issue Date (Optional)</label>
                                <input type="date" name="issue_date" value={formData.issue_date} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', colorScheme: 'dark' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Upload Document {editMode ? '(Optional, selecting a new file replaces current)' : '*'}</label>
                            <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
                            <small style={{ color: 'var(--text-secondary)' }}>Accepted formats: PDF, JPG, PNG (Max 5MB)</small>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Notes (Optional)</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional information..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', minHeight: '60px' }}></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" onClick={closeForm} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                {loading ? 'Saving...' : (editMode ? 'Update Document' : 'Upload Document')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {loading && documents.length === 0 && <p>Loading documents...</p>}
                {!loading && documents.length === 0 && <p>No documents found for this land.</p>}

                {documents.map((doc, index) => (
                    <div key={doc.id || `doc-${index}`} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0' }}>{doc.type}</h4>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{doc.document_name || doc.doc_no || 'System Document'}</div>
                            </div>
                            <span className={getStatusBadgeClass(doc.verification)} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                {doc.verification || 'Pending'}
                            </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.5rem' }}>
                            {doc.doc_no && <div><strong>No:</strong> {doc.doc_no}</div>}
                            {doc.date && <div><strong>Date:</strong> {doc.date}</div>}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {doc.file_path && (
                                <a href={`${API_BASE}${doc.file_path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
                                    <Eye size={14} /> View
                                </a>
                            )}
                            {doc.is_uploaded && (
                                <>
                                    {doc.verification === 'Pending' && (
                                        <button type="button" onClick={() => handleVerify(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', background: 'rgba(46, 204, 113, 0.2)', color: 'var(--success)', borderRadius: '4px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
                                            Verify
                                        </button>
                                    )}
                                    <button type="button" onClick={() => openForm(doc)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', background: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent-color)', borderRadius: '4px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
                                        <Edit2 size={14} /> Update
                                    </button>
                                    <button type="button" onClick={() => handleDelete(doc.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', background: 'rgba(220, 53, 69, 0.2)', color: 'var(--danger)', borderRadius: '4px', fontSize: '0.8rem', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SellerDocumentManager;
