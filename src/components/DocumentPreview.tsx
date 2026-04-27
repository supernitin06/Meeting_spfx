import React, { useState, useEffect } from 'react';
import { X, Download, Save, FileText, File as FileIcon, Image as ImageIcon, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import RichTextEditor from './RichTextEditor';

const DocumentPreview: React.FC = () => {
  const { activePreviewFile, setActivePreviewFile, updateMeeting, meetings } = useStore();
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activePreviewFile && isEditable(activePreviewFile.name)) {
      fetchContent();
    } else {
      setContent('');
      setIsEditing(false);
      setError(null);
    }
  }, [activePreviewFile]);

  const isEditable = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['txt', 'md', 'html', 'json'].includes(ext || '');
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
    if (isEditable(fileName)) return 'text';
    return 'other'; // everything else handled by viewer
  };

  // 🔥 Universal viewer (handles pdf, doc, excel, ppt, etc.)
  const getViewerUrl = (url: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    // Browsers handle PDF natively in iframe
    if (ext === 'pdf') return url;

    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  };

  const fetchContent = async () => {
    if (!activePreviewFile?.url) return;
    setIsLoading(true);
    try {
      const response = await fetch(activePreviewFile.url);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('Error fetching file content:', error);
      setError('Failed to load file content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activePreviewFile) return;
    setIsSaving(true);
    try {
      const blob = new Blob([content], { type: activePreviewFile.type || 'text/plain' });
      const newDownloadURL = URL.createObjectURL(blob);

      if (activePreviewFile.meetingId) {
        const meeting = meetings.find(m => m.id === activePreviewFile.meetingId);
        if (meeting) {
          if (activePreviewFile.agendaItemId) {
            const updatedAgenda = meeting.agendaItems?.map(item =>
              item.id === activePreviewFile.agendaItemId
                ? { ...item, documentUrl: newDownloadURL }
                : item
            );
            await updateMeeting(meeting.id, { agendaItems: updatedAgenda });
          } else {
            const updatedFiles = meeting.files?.map(f =>
              f.id === activePreviewFile.id
                ? { ...f, url: newDownloadURL }
                : f
            );
            await updateMeeting(meeting.id, { files: updatedFiles });
          }
        }
      }

      setActivePreviewFile({
        ...activePreviewFile,
        url: newDownloadURL
      });

      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!activePreviewFile) return null;

  const fileType = getFileType(activePreviewFile.name);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              {fileType === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{activePreviewFile.name}</h3>
          </div>

          <div className="flex items-center gap-4">
            {isEditable(activePreviewFile.name) && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title={isEditing ? "View Mode" : "Edit Mode"}
              >
                <Edit3 size={20} />
              </button>
            )}

            {isEditing && (
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors disabled:opacity-50"
                title="Save Changes"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              </button>
            )}

            <a 
              href={activePreviewFile.url} 
              download 
              target="_blank"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              title="Download File"
            >
              <Download size={20} />
            </a>

            <button 
              onClick={() => setActivePreviewFile(null)}
              className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 p-4 md:p-6 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-sm font-medium text-gray-500">Loading content...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Error Loading File</h4>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.open(activePreviewFile.url)}
                className="btn-primary"
              >
                Open in New Tab
              </button>
            </div>
          ) : isEditing ? (
            <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden border">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          ) : (
            <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden border flex items-center justify-center">
              
              {/* Image */}
              {fileType === 'image' && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={activePreviewFile.url}
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                    alt={activePreviewFile.name}
                  />
                </div>
              )}

              {/* Text */}
              {fileType === 'text' && (
                <div className="w-full h-full overflow-auto p-8 bg-white">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                    {content}
                  </pre>
                </div>
              )}

              {/* 🔥 All other files */}
              {fileType === 'other' && (
                <div className="w-full h-full relative">
                  <iframe
                    src={getViewerUrl(activePreviewFile.url, activePreviewFile.name)}
                    className="w-full h-full border-0"
                    title="Document Preview"
                  />
                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={() => window.open(activePreviewFile.url)}
                      className="bg-white/90 backdrop-blur shadow-lg border px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-white transition-all flex items-center gap-2"
                    >
                      <Download size={16} />
                      Open Original
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={() => setActivePreviewFile(null)}
            className="btn-default"
          >
            Close Preview
          </button>
          <a 
            href={activePreviewFile.url} 
            target="_blank"
            className="btn-primary flex items-center gap-2"
          >
            <Download size={18} />
            Download Original
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;