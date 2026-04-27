import React, { useState, useEffect, useContext } from 'react';
import { DefaultButton, PrimaryButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { SlArrowRight, SlArrowDown } from 'react-icons/sl';
import {
  FilePlus,
  Mail,
  Link,
  Edit2,
  Folder,
  FileText,
  Bold,
  Italic,
  Underline,
  Eraser,
  List,
  ListOrdered,
  Palette,
  Type,
  Table,
  Image,
  Undo,
  Redo,
  Eye,
  Code,
  Info,
  FileSpreadsheet,
  Presentation,
  Clipboard,
  Heading
} from 'lucide-react';
import ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';
import MsgReader from '@kenjiuno/msgreader';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import { FileMetadata } from '../types';

export const UserContext = React.createContext<any>(null);
export const myContextValue = React.createContext<any>(null);

// --- MOCKED GLOBALS ---
const globalCommon = {
  devError: (err: any) => console.error('Error:', err),
  devSuccess: (msg: string) => console.log('Success:', msg),
  SendTeamMessages: async (msg: string, context: any) => console.log('Teams Message Sent:', msg),
};
const Tooltip = ({ children, text }: any) => <div title={text}>{children}</div>;
const PageLoader = ({ active }: { active: boolean }) => active ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
    <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F5596]"></div>
      <p className="text-sm font-medium text-[#333333]">Processing document...</p>
    </div>
  </div>
) : null;
const DynamicAlert = ({ message, type }: any) => <div className={`p-4 mb-4 text-sm rounded-lg ${type === 'danger' ? 'bg-red-50 text-red-800' : type === 'success' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>{message}</div>;

// --- INTERFACES ---
export interface IAncToolProps {
  item: any;
  Context: any; // SPFx WebPartContext
  siteUrl: string;
  listName: string;
  SmartMetadataListID?: string;
  onFilesUpdated?: (files: ISharePointFile[]) => void;
}

export interface ISharePointFile {
  Id: string | number;
  Name: string;
  ServerRelativeUrl: string;
  TimeLastModified: string;
  Rank?: number;
  IsTagged?: boolean;
}

export interface ISharePointFolder {
  Name: string;
  ServerRelativeUrl: string;
  Files: ISharePointFile[];
  Folders: ISharePointFolder[];
}

// --- HELPER FUNCTIONS ---
const sanitizeFileName = (fileName: string) => {
  return fileName.replace(/[~#%&*{}\\:<>?/+|"]/g, '').trim();
};

export const AncTool: React.FC<IAncToolProps> = (props) => {
  const { item, Context, siteUrl, listName, SmartMetadataListID } = props;
  const userCtx = useContext(UserContext);
  const myCtx = useContext(myContextValue);
  const { addFileToMeeting, removeFileFromMeeting, meetings, updateMeeting, setActivePreviewFile } = useStore();
  const currentMeeting = meetings.find(m => m.id === item?.id);

  // --- STATE ---
  const [pageLoaderActive, setPageLoaderActive] = useState<boolean>(false);
  const [ExistingFiles, setExistingFiles] = useState<ISharePointFile[]>([]);
  const [currentFolderFiles, setCurrentFolderFiles] = useState<ISharePointFile[]>([]);
  const [searchArrays, setSearchArrays] = useState<{ existing: string, current: string }>({ existing: '', current: '' });
  const [SelectedItem, setSelectedItem] = useState<ISharePointFile | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'UPLOAD' | 'DRAG_DROP' | 'LINK_TO'>('UPLOAD');
  const [uploadSearchText, setUploadSearchText] = useState<string>('');
  const [uploadRenameText, setUploadRenameText] = useState<string>('');
  const [uploadRank, setUploadRank] = useState<number>(5);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<ISharePointFile | null>(null);

  const [selectedOnlineFileType, setSelectedOnlineFileType] = useState<'Word' | 'Excel' | 'PPT' | 'Note' | null>(null);
  const [newOnlineFileName, setNewOnlineFileName] = useState<string>('');

  const [renamedFileName, setRenamedFileName] = useState<string>('');
  const [externalLinkUrl, setExternalLinkUrl] = useState<string>('');
  const [externalLinkName, setExternalLinkName] = useState<string>('');
  const [selectedRank, setSelectedRank] = useState<number>(0);

  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [targetFolderPath, setTargetFolderPath] = useState<string>('');
  const [tempFiles, setTempFiles] = useState<ISharePointFile[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (item) {
      initTool();
    }
  }, [item]);

  useEffect(() => {
    if (currentMeeting?.files || tempFiles.length > 0) {
      const mappedFiles: ISharePointFile[] = (currentMeeting?.files || []).map(f => ({
        Id: f.id,
        Name: f.name,
        ServerRelativeUrl: f.url,
        TimeLastModified: f.uploadedAt,
        IsTagged: true
      }));
      const allFiles = [...mappedFiles, ...tempFiles];
      setCurrentFolderFiles(allFiles);
      setExistingFiles(allFiles);
      if (props.onFilesUpdated) {
        props.onFilesUpdated(allFiles);
      }
    }
  }, [currentMeeting?.files, tempFiles]);

  const initTool = async () => {
    setPageLoaderActive(true);
    try {
      const basePath = generateDynamicPath();
      setTargetFolderPath(basePath);
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  // --- PATH GENERATOR ---
  const generateDynamicPath = (): string => {
    return `meetings/${item?.id || 'unknown'}`;
  };

  // --- UPLOAD & DRAG/DROP ---
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    queueFilesForUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      queueFilesForUpload(files);
    }
  };

  const queueFilesForUpload = (files: File[]) => {
    setUploadQueue(prev => [...prev, ...files]);
    processUploadQueue([...uploadQueue, ...files]);
  };

  const processUploadQueue = async (files: File[]) => {
    if (files.length === 0) return;
    setPageLoaderActive(true);

    for (const file of files) {
      await uploadFile(file);
    }

    setUploadQueue([]);
    setPageLoaderActive(false);
    setIsUploadModalOpen(false);
  };

  const uploadFile = async (file: File, customName?: string) => {
    if (!currentMeeting) {
      globalCommon.devError("No meeting context found for upload.");
      return;
    }

    try {
      let finalName = customName || file.name;
      finalName = sanitizeFileName(finalName);

      if (finalName.toLowerCase().endsWith('.msg')) {
        const arrayBuffer = await file.arrayBuffer();
        const msgReader = new MsgReader(arrayBuffer);
        const msgData = msgReader.getFileData();
        globalCommon.devSuccess(`Processed MSG: ${msgData.subject}`);
      }

      const fileId = uuidv4();
      const storagePath = `${targetFolderPath}/${fileId}_${finalName}`;
      // Simulate upload by converting to Data URL (Local Storage)
      const downloadURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Unable to read file'));
        reader.readAsDataURL(file);
      });
      
      const newFile: FileMetadata = {
        id: fileId,
        name: finalName,
        url: downloadURL,
        storagePath: storagePath,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User'
      };
      
      await addFileToMeeting(currentMeeting.id, newFile);

      globalCommon.devSuccess(`Uploaded: ${finalName}`);
      globalCommon.SendTeamMessages(`New file uploaded: ${finalName} to ${currentMeeting.title}`, myCtx);
    } catch (error) {
      globalCommon.devError(error);
    }
  };

  // --- TAGGING ---
  const deleteFile = async (file: ISharePointFile) => {
    if (!currentMeeting) return;
    setPageLoaderActive(true);
    try {
      if (file.ServerRelativeUrl && file.ServerRelativeUrl.startsWith('blob:')) {
        // Revoke the object URL to free up memory
        URL.revokeObjectURL(file.ServerRelativeUrl);
        setTempFiles(prev => prev.filter(f => f.Id !== file.Id));
      } else {
        // Find the file metadata in the meeting to get the storagePath
        const fileMetadata = currentMeeting.files?.find(f => f.id === String(file.Id));
        
        // Local storage simulation doesn't need explicit storage deletion
        // but we would handle it here if there was a real backend.

        await removeFileFromMeeting(currentMeeting.id, String(file.Id));
      }
      globalCommon.devSuccess('File removed from meeting successfully.');
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
      setIsConfirmationModalOpen(false);
      setFileToDelete(null);
    }
  };

  // --- DIRECT DOCUMENT GENERATION ---
  const generateWord = async () => {
    setPageLoaderActive(true);
    try {
      const fileName = newOnlineFileName.trim() || sanitizeFileName(currentMeeting?.title || 'Concept');
      const content = `Concept: ${currentMeeting?.title || 'Untitled'}`;
      const blob = new Blob([content], { type: 'application/msword' });
      const file = new File([blob], `${fileName}.doc`, { type: blob.type });

      await uploadFile(file);
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  const generateExcel = async () => {
    setPageLoaderActive(true);
    try {
      const fileName = newOnlineFileName.trim() || sanitizeFileName(currentMeeting?.title || 'Concept');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Concept');
      sheet.addRow(['ID', 'Title', 'Description']);
      sheet.addRow([currentMeeting?.id || uuidv4(), currentMeeting?.title || 'Untitled', 'Generated Concept']);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], `${fileName}.xlsx`, { type: blob.type });

      await uploadFile(file);
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  const generatePowerPoint = async () => {
    setPageLoaderActive(true);
    try {
      const fileName = newOnlineFileName.trim() || sanitizeFileName(currentMeeting?.title || 'Concept');
      const pres = new pptxgen();
      const slide = pres.addSlide();
      slide.addText(`Concept: ${currentMeeting?.title || 'Untitled'}`, { x: 1, y: 1, fontSize: 24 });

      const buffer = await pres.write({ outputType: 'arraybuffer' });
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const file = new File([blob], `${fileName}.pptx`, { type: blob.type });

      await uploadFile(file);
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  const generateNote = async () => {
    setPageLoaderActive(true);
    try {
      const fileName = newOnlineFileName.trim() || sanitizeFileName(currentMeeting?.title || 'Note');
      const content = `Note for: ${currentMeeting?.title || 'Untitled'}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `${fileName}.txt`, { type: blob.type });

      await uploadFile(file);
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  const saveExternalLink = async () => {
    if (!externalLinkUrl || !externalLinkName) return;
    setPageLoaderActive(true);
    try {
      // In SharePoint, links can be saved as .url files or list items.
      // Here we mock creating a .url file
      const urlContent = `[InternetShortcut]\nURL=${externalLinkUrl}`;
      const blob = new Blob([urlContent], { type: 'text/plain' });
      const file = new File([blob], `${sanitizeFileName(externalLinkName)}.url`, { type: 'text/plain' });

      await uploadFile(file);
      setIsUploadModalOpen(false);
      setExternalLinkUrl('');
      setExternalLinkName('');
    } catch (error) {
      globalCommon.devError(error);
    } finally {
      setPageLoaderActive(false);
    }
  };

  // --- RENDER HELPERS ---
  const rankOptions: IDropdownOption[] = [
    { key: 8, text: "(8) Top Highlights" },
    { key: 7, text: "(7) Featured Item" },
    { key: 6, text: "(6) Key Item" },
    { key: 5, text: "(5) Relevant Item" },
    { key: 4, text: "(4) Background Item" },
    { key: 2, text: "(2) to be verified" },
    { key: 1, text: "(1) Archive" },
    { key: 0, text: "(0) No Show" }
  ];

  const filteredCurrentFiles = currentFolderFiles.filter(f =>
    f.Name.toLowerCase().includes(searchArrays.current.toLowerCase())
  );

  const headerClass = 'bg-[#2F5596] text-white';

  return (
    <div className="anc-tool-widget w-[380px] border border-[#DDDDDD] rounded shadow-sm bg-white font-sans relative">
      <PageLoader active={pageLoaderActive} />

      {/* HEADER */}
      <div className={`header px-3 py-2 flex justify-between items-center rounded-t ${headerClass}`}>
        <span className="font-semibold text-sm">Add & Connect Tool</span>
      </div>

      {/* BODY */}
      <div className="p-2 flex gap-2">
        {/* Upload Section */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#333333] mb-1 px-1">Upload</span>
          <div className="bg-[#F0F0F0] p-2 rounded flex gap-2 h-full">
            <button onClick={() => setIsUploadModalOpen(true)} className="flex flex-col items-center justify-center hover:bg-[#DDDDDD] p-1 rounded min-w-[44px] transition-colors border-0 bg-transparent cursor-pointer">
              <FilePlus size={24} className="text-[#2F5596] mb-1" />
              <span className="text-[10px] text-[#333333]">Files</span>
            </button>
          </div>
        </div>

        {/* New Online-File Section */}
        <div className="flex flex-col flex-1">
          <span className="text-xs font-semibold text-[#333333] mb-1 px-1">New Online-File</span>
          <div className="bg-[#F0F0F0] p-2 rounded flex justify-between h-full">
            <button
              onClick={() => setSelectedOnlineFileType('Word')}
              className={`flex flex-col items-center justify-center p-1 rounded min-w-[40px] transition-colors border-0 cursor-pointer ${selectedOnlineFileType === 'Word' ? 'bg-[#2b579a] text-white' : 'bg-transparent hover:bg-[#DDDDDD] text-[#333333]'}`}
            >
              <FileText size={20} className={`${selectedOnlineFileType === 'Word' ? 'text-white' : 'text-[#2b579a]'} mb-1`} />
              <span className="text-[10px]">Word</span>
            </button>
            <button
              onClick={() => setSelectedOnlineFileType('Excel')}
              className={`flex flex-col items-center justify-center p-1 rounded min-w-[40px] transition-colors border-0 cursor-pointer ${selectedOnlineFileType === 'Excel' ? 'bg-[#217346] text-white' : 'bg-transparent hover:bg-[#DDDDDD] text-[#333333]'}`}
            >
              <FileSpreadsheet size={20} className={`${selectedOnlineFileType === 'Excel' ? 'text-white' : 'text-[#217346]'} mb-1`} />
              <span className="text-[10px]">Excel</span>
            </button>
            <button
              onClick={() => setSelectedOnlineFileType('PPT')}
              className={`flex flex-col items-center justify-center p-1 rounded min-w-[40px] transition-colors border-0 cursor-pointer ${selectedOnlineFileType === 'PPT' ? 'bg-[#b7472a] text-white' : 'bg-transparent hover:bg-[#DDDDDD] text-[#333333]'}`}
            >
              <Presentation size={20} className={`${selectedOnlineFileType === 'PPT' ? 'text-white' : 'text-[#b7472a]'} mb-1`} />
              <span className="text-[10px]">PPT</span>
            </button>
            <button
              onClick={() => {
                setSelectedOnlineFileType('Note');
                setNewOnlineFileName('');
              }}
              className={`flex flex-col items-center justify-center p-1 rounded min-w-[40px] transition-colors border-0 cursor-pointer ${selectedOnlineFileType === 'Note' ? 'bg-[#2F5596] text-white' : 'bg-transparent hover:bg-[#DDDDDD] text-[#333333]'}`}
            >
              <Clipboard size={22} className={`${selectedOnlineFileType === 'Note' ? 'text-white' : 'text-[#2F5596]'} mb-1`} />
              <span className="text-[10px]">Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Creation Controls */}
      {selectedOnlineFileType && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          <input
            type="text"
            placeholder="Enter File Name"
            className="w-full rounded-none border border-[#DDDDDD] h-9 text-sm px-3 focus:outline-none"
            value={newOnlineFileName}
            onChange={(e) => setNewOnlineFileName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              className={`btn-primary px-5 py-1.5 ${!newOnlineFileName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!newOnlineFileName.trim()}
              onClick={() => {
                if (newOnlineFileName.trim()) {
                  setIsConfirmationModalOpen(true);
                }
              }}
            >
              Create
            </button>
            <button
              className="btn-default px-5 py-1.5"
              onClick={() => {
                setSelectedOnlineFileType(null);
                setNewOnlineFileName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SMART INFORMATION MODAL */}

      {isConfirmationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-[650px]">
            <div className="modal-header">
              <h5 className="text-[21px] text-[#2F5596] font-semibold m-0">
                Upload Confirmation
              </h5>
              <button type="button" className="text-2xl leading-none hover:text-red-500 border-0 bg-transparent cursor-pointer" onClick={() => setIsConfirmationModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#333333] min-w-[100px]">File Name:</span>
                  <span className="text-[#333333]">{newOnlineFileName}{selectedOnlineFileType === 'Word' ? '.docx' : selectedOnlineFileType === 'Excel' ? '.xlsx' : selectedOnlineFileType === 'PPT' ? '.pptx' : '.txt'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#333333] min-w-[100px]">Folder:</span>
                  <div className="flex items-center gap-2 text-[#333333]">
                    <span className="truncate max-w-[400px]">{targetFolderPath}</span>
                    <Folder className="text-[#2F5596]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#333333] min-w-[100px]">Metadata-Tag:</span>
                  <span className="text-[#333333]">{currentMeeting?.title || 'Untitled'}</span>
                </div>
              </div>

              <div className="mt-6 border border-[#DDDDDD] rounded overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F0F0F0] text-[#918D8D] font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-2 font-bold">FILE NAME</th>
                      <th className="px-4 py-2 text-center font-bold">LINK</th>
                      <th className="px-4 py-2 text-center font-bold">EMAIL</th>
                      <th className="px-4 py-2 text-center font-bold">EDIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#DDDDDD]">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <FileText className="text-[#2F5596]" size={18} />
                        <span className="text-[#2F5596] hover:underline cursor-pointer">
                          {newOnlineFileName}{selectedOnlineFileType === 'Word' ? '.docx' : selectedOnlineFileType === 'Excel' ? '.xlsx' : selectedOnlineFileType === 'PPT' ? '.pptx' : '.txt'}
                        </span>
                        <span className="text-[#918D8D] text-xs">(12.22 KB)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link className="text-[#2F5596] cursor-pointer" size={18} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Mail className="text-[#2F5596] cursor-pointer" size={18} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Edit2 className="text-[#2F5596] cursor-pointer" size={18} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-3">
              <button
                className="btn-default px-6 py-1.5"
                onClick={() => setIsConfirmationModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-default px-6 py-1.5"
              >
                Open file
              </button>
              <button
                className="btn-primary px-8 py-1.5"
                onClick={() => {
                  if (selectedOnlineFileType === 'Word') generateWord();
                  else if (selectedOnlineFileType === 'Excel') generateExcel();
                  else if (selectedOnlineFileType === 'PPT') generatePowerPoint();
                  else if (selectedOnlineFileType === 'Note') generateNote();

                  setIsConfirmationModalOpen(false);
                  setSelectedOnlineFileType(null);
                  setNewOnlineFileName('');
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isManageModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-6xl max-h-[90vh]">
            <div className="modal-header">
              <h5 className="flex items-center text-[21px] text-[#2F5596] font-semibold m-0">
                <Heading className="mr-2" /> Manage Files: {currentMeeting?.title}
              </h5>
              <button type="button" className="text-2xl leading-none hover:text-red-500 border-0 bg-transparent cursor-pointer" onClick={() => setIsManageModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body overflow-y-auto">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search current folder files..."
                  className="w-full px-3 py-2 border border-[#DDDDDD] rounded text-sm focus:outline-none"
                  value={searchArrays.current}
                  onChange={(e) => setSearchArrays({ ...searchArrays, current: e.target.value })}
                />
              </div>

              <div className="overflow-x-auto border border-[#DDDDDD] rounded">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F0F0F0] border-b border-[#DDDDDD]">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-[#333333]">Tag</th>
                      <th className="px-4 py-3 font-semibold text-[#333333]">File Name</th>
                      <th className="px-4 py-3 font-semibold text-[#333333]">Rank</th>
                      <th className="px-4 py-3 font-semibold text-[#333333]">Modified</th>
                      <th className="px-4 py-3 font-semibold text-[#333333]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDDDDD]">
                    {filteredCurrentFiles.map(file => (
                      <tr key={file.Id} className="hover:bg-[#F0F0F0]">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#2F5596] rounded border-[#DDDDDD] focus:ring-[#2F5596]"
                            checked={file.IsTagged || false}
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-[#333333]">
                          <button 
                            onClick={() => {
                              const fileMeta = currentMeeting?.files?.find(f => f.id === String(file.Id));
                              if (fileMeta) {
                                setActivePreviewFile({
                                  ...fileMeta,
                                  meetingId: currentMeeting?.id
                                });
                              }
                            }}
                            className="text-[#2F5596] hover:underline bg-transparent border-0 p-0 cursor-pointer text-left"
                          >
                            {file.Name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Dropdown
                            options={rankOptions}
                            selectedKey={file.Rank || 0}
                            onChange={(_, option) => {
                              const updated = currentFolderFiles.map(f => f.Id === file.Id ? { ...f, Rank: option?.key as number } : f);
                              setCurrentFolderFiles(updated);
                            }}
                            styles={{ root: { width: 120 } }}
                          />
                        </td>
                        <td className="px-4 py-3 text-[#918D8D]">{new Date(file.TimeLastModified).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              className="btn-primary px-3 py-1 text-xs"
                              onClick={() => {
                                setSelectedItem(file);
                                setRenamedFileName(file.Name);
                                setIsRenameModalOpen(true);
                              }}
                            >
                              Rename
                            </button>
                            <button
                              className="bg-red-600 text-white px-3 py-1 text-xs rounded hover:bg-red-700 transition-colors border-0 cursor-pointer"
                              onClick={() => {
                                setFileToDelete(file);
                                setIsConfirmationModalOpen(true);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCurrentFiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#918D8D]">No files found in this folder.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer flex justify-end">
              <button className="btn-default px-4 py-2 text-sm" onClick={() => setIsManageModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL (DOCUMENTS VIEW) */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-[1050px] max-h-[95vh]">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2F5596] rounded-full flex items-center justify-center text-white font-bold text-xs">
                  ANC
                </div>
                <h5 className="text-[21px] text-[#2F5596] font-semibold m-0">
                  Add & Connect Tool - {currentMeeting?.title}
                </h5>
              </div>
              <button type="button" className="text-3xl leading-none hover:text-red-500 border-0 bg-transparent cursor-pointer" onClick={() => setIsUploadModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body p-0 bg-[#F8F9FA] overflow-y-auto flex-1">
              {/* Main Tabs */}
              <div className="px-6 pt-3">
                <div className="flex">
                  <div className="px-6 py-2 bg-white border-t border-l border-r border-[#DDDDDD] text-[#2F5596] text-sm font-semibold rounded-t-md shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                    DOCUMENTS
                  </div>
                </div>
              </div>

              <div className="mx-6 mb-6 p-6 bg-white border border-[#DDDDDD] rounded-b-md shadow-sm min-h-[500px]">
                {/* Section 1: Upload a Document */}
                <div className="mb-8">
                  <h6 className="text-[#2F5596] font-semibold text-[15px] mb-2 border-b border-[#2F5596] pb-1 w-full">1. Upload a Document</h6>

                  <div className="flex flex-col lg:flex-row gap-8 mt-4">
                    {/* Left Side: Folder Info & Search */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <span className="block text-sm font-bold text-[#333333]">Upload Folder</span>
                        <div className="flex items-center gap-2 text-sm text-[#333333] mt-1">
                          <span className="truncate max-w-[350px]">{targetFolderPath}</span>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-[#333333]">
                        <span>All files in default folder:</span>
                        <button
                          className="text-[#2F5596] hover:underline bg-transparent border-0 p-0 text-sm font-medium cursor-pointer"
                          onClick={() => setIsManageModalOpen(true)}
                        >
                          View
                        </button>
                      </div>

                      <div className="mt-6">
                        <span className="block text-sm font-bold text-[#333333] mb-2">Search Existing Document</span>
                        <input
                          type="text"
                          placeholder="Search..."
                          className="w-full rounded-none border border-[#DDDDDD] h-9 text-sm px-3 focus:outline-none focus:border-[#2F5596]"
                          value={uploadSearchText}
                          onChange={(e) => setUploadSearchText(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Right Side: Upload Box */}
                    <div className="w-full lg:w-[450px] border border-[#DDDDDD] rounded shadow-sm bg-white">
                      {/* Sub Tabs */}
                      <div className="flex border-b border-[#DDDDDD] bg-white">
                        <button
                          className={`flex-1 py-3 text-[12px] font-bold transition-colors cursor-pointer ${activeSubTab === 'UPLOAD' ? 'text-[#2F5596] border-b-2 border-[#2F5596]' : 'text-[#918D8D] hover:bg-[#F0F0F0]'}`}
                          onClick={() => setActiveSubTab('UPLOAD')}
                        >
                          UPLOAD
                        </button>
                        <button
                          className={`flex-1 py-3 text-[12px] font-bold transition-colors cursor-pointer ${activeSubTab === 'DRAG_DROP' ? 'text-[#2F5596] border-b-2 border-[#2F5596]' : 'text-[#918D8D] hover:bg-[#F0F0F0]'}`}
                          onClick={() => setActiveSubTab('DRAG_DROP')}
                        >
                          DRAG & DROP
                        </button>
                        <button
                          className={`flex-1 py-3 text-[12px] font-bold transition-colors cursor-pointer ${activeSubTab === 'LINK_TO' ? 'text-[#2F5596] border-b-2 border-[#2F5596]' : 'text-[#918D8D] hover:bg-[#F0F0F0]'}`}
                          onClick={() => setActiveSubTab('LINK_TO')}
                        >
                          LINK TO
                        </button>
                      </div>

                      <div className="p-5">
                        {activeSubTab === 'UPLOAD' && (
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-sm font-semibold text-[#333333]">Item Rank</span>
                                <div className="w-4 h-4 rounded-full border border-[#918D8D] flex items-center justify-center text-[10px] text-[#918D8D] cursor-help" title="Select the importance rank for this document">i</div>
                              </div>
                              <Dropdown
                                options={rankOptions}
                                selectedKey={uploadRank}
                                onChange={(_, option) => setUploadRank(option?.key as number)}
                                styles={{ root: { width: '100%', height: 36 } }}
                              />
                            </div>

                            <div className="flex items-center border border-[#DDDDDD] rounded overflow-hidden h-9">
                              <button
                                className="bg-[#F0F0F0] px-4 h-full text-sm text-[#333333] border-r border-[#DDDDDD] hover:bg-[#DDDDDD] transition-colors font-medium cursor-pointer"
                                onClick={() => document.getElementById('modalFileInput')?.click()}
                              >
                                Choose file
                              </button>
                              <span className="px-3 text-sm text-[#918D8D] truncate flex-1 bg-white">
                                {uploadQueue.length > 0 ? uploadQueue[0].name : 'No file chosen'}
                              </span>
                              <input
                                type="file"
                                id="modalFileInput"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setUploadQueue([e.target.files[0]]);
                                    setRenamedFileName(e.target.files[0].name);
                                  }
                                }}
                              />
                            </div>

                            <div>
                              <span className="block text-sm font-semibold text-[#333333] mb-2">Rename The Document</span>
                              <input
                                type="text"
                                placeholder="Rename The Document"
                                className="w-full rounded-none border border-[#DDDDDD] h-9 text-sm px-3 focus:outline-none"
                                value={renamedFileName}
                                onChange={(e) => setRenamedFileName(e.target.value)}
                              />
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                className={`btn-primary px-8 py-2 ${uploadQueue.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={uploadQueue.length === 0}
                                onClick={() => processUploadQueue(uploadQueue)}
                              >
                                Upload
                              </button>
                            </div>
                          </div>
                        )}

                        {activeSubTab === 'DRAG_DROP' && (
                          <div
                            className="p-8 border-2 border-dashed border-[#DDDDDD] text-center rounded bg-[#F0F0F0] cursor-pointer hover:bg-[#DDDDDD] transition-colors"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('modalFileInput')?.click()}
                          >
                            <FilePlus size={40} className="text-[#918D8D] mx-auto mb-1.5" />
                            <p className="text-[#918D8D] text-xs">Drag & Drop files here or click to select</p>
                          </div>
                        )}

                        {activeSubTab === 'LINK_TO' && (
                          <div className="space-y-3">
                            <div className="mb-2">
                              <label className="block text-sm font-semibold mb-1 text-[#333333]">Link Name</label>
                              <input
                                type="text"
                                value={externalLinkName}
                                onChange={(e) => setExternalLinkName(e.target.value)}
                                placeholder="e.g., Project Dashboard"
                                className="w-full h-9 px-3 border border-[#DDDDDD] rounded focus:outline-none focus:border-[#2F5596] text-sm"
                              />
                            </div>
                            <div className="mb-2">
                              <label className="block text-sm font-semibold mb-1 text-[#333333]">URL</label>
                              <input
                                type="url"
                                value={externalLinkUrl}
                                onChange={(e) => setExternalLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full h-9 px-3 border border-[#DDDDDD] rounded focus:outline-none focus:border-[#2F5596] text-sm"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                className="btn-primary px-5 py-1.5"
                                onClick={saveExternalLink}
                                disabled={!externalLinkUrl || !externalLinkName}
                              >
                                Save Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Already Tagged Documents */}
                <div className="mt-4">
                  <h6 className="text-[#2F5596] font-semibold text-[15px] mb-2 border-b border-[#2F5596] pb-1 w-full">2. Already Tagged Documents</h6>

                  {currentFolderFiles.length > 0 ? (
                    <div className="mt-4 border border-[#DDDDDD] rounded-md overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0F0F0] text-[#918D8D] font-bold uppercase text-[11px]">
                          <tr>
                            <th className="px-4 py-2 font-bold">FILE NAME</th>
                            <th className="px-4 py-2 text-center font-bold">RANK</th>
                            <th className="px-4 py-2 text-center font-bold">MODIFIED</th>
                            <th className="px-4 py-2 text-center font-bold">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentFolderFiles.map(file => (
                            <tr key={file.Id} className="border-b border-[#DDDDDD] hover:bg-[#F0F0F0]">
                              <td className="px-4 py-3 flex items-center gap-2">
                                <FileText className="text-[#2F5596]" size={18} />
                                <button 
                                  onClick={() => {
                                    const fileMeta = currentMeeting?.files?.find(f => f.id === String(file.Id));
                                    if (fileMeta) {
                                      setActivePreviewFile({
                                        ...fileMeta,
                                        meetingId: currentMeeting?.id
                                      });
                                    }
                                  }}
                                  className="text-[#2F5596] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-[200px] text-left" 
                                  title={file.Name}
                                >
                                  {file.Name}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[#333333] text-xs">{file.Rank || '-'}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[#918D8D] text-xs">{new Date(file.TimeLastModified).toLocaleDateString()}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Edit2
                                    className="text-[#2F5596] cursor-pointer hover:text-[#1e3a6d]"
                                    size={18}
                                    onClick={() => {
                                      setSelectedItem(file);
                                      setRenamedFileName(file.Name);
                                      setIsRenameModalOpen(true);
                                    }}
                                    
                                  />
                                  <button
                                    className="text-red-600 hover:text-red-800 bg-transparent border-0 p-0 cursor-pointer"
                                    onClick={() => {
                                      setFileToDelete(file);
                                      setIsConfirmationModalOpen(true);
                                    }}
                                    title="Delete"
                                  >
                                    <Eraser size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-4 border border-dashed border-[#DDDDDD] rounded-md py-12 flex items-center justify-center bg-white">
                      <span className="text-[#918D8D] text-[14px] font-medium">No Documents Tagged</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {isRenameModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="modal-header">
              <h5 className="text-[21px] text-[#2F5596] font-semibold m-0">Rename File</h5>
              <button type="button" className="text-2xl leading-none hover:text-red-500 border-0 bg-transparent cursor-pointer" onClick={() => setIsRenameModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#333333] mb-1">New File Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#DDDDDD] rounded-none focus:outline-none focus:border-[#2F5596] sm:text-sm"
                  value={renamedFileName}
                  onChange={(e) => setRenamedFileName(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2">
              <button className="btn-primary px-4 py-2 text-sm" onClick={async () => {
                if (SelectedItem && renamedFileName && currentMeeting) {
                  setPageLoaderActive(true);
                  try {
                    const updatedFiles = currentMeeting.files?.map(f => 
                      f.id === SelectedItem.Id ? { ...f, name: renamedFileName } : f
                    ) || [];
                    
                    await updateMeeting(currentMeeting.id, { files: updatedFiles });

                    globalCommon.devSuccess('File renamed successfully');
                    setIsRenameModalOpen(false);
                  } catch (error) {
                    globalCommon.devError(error);
                  } finally {
                    setPageLoaderActive(false);
                  }
                }
              }}>Save</button>
              <button className="btn-default px-4 py-2 text-sm" onClick={() => setIsRenameModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="modal-header">
              <h5 className="text-[21px] text-[#2F5596] font-semibold m-0">Confirm Deletion</h5>
              <button type="button" className="text-2xl leading-none hover:text-red-500 border-0 bg-transparent cursor-pointer" onClick={() => setIsConfirmationModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body p-6">
              <p className="text-sm text-[#333333]">Are you sure you want to remove <span className="font-bold">{fileToDelete?.Name}</span> from the meeting? This will also delete the file from storage.</p>
            </div>
            <div className="modal-footer flex justify-end gap-2">
              <button className="btn-primary bg-red-600 border-red-600 hover:bg-red-700 px-4 py-2 text-sm" onClick={() => fileToDelete && deleteFile(fileToDelete)}>Delete</button>
              <button className="btn-default px-4 py-2 text-sm" onClick={() => setIsConfirmationModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TASK TYPES SELECTION MODAL */}

    </div>
  );
};

export default AncTool;
