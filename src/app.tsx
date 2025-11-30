import React, { useState, useEffect } from 'react';
import { Send, Hash, UserPlus, Layout, MessageSquare, BarChart2, Trash2, Plus, Lock, LogIn, AlertCircle, Check, Loader2, Image as ImageIcon, X } from 'lucide-react';
import logoImage from './media/WLCD.jpg'; 
import judgeImage from './media/Judge.jpg';


// --- Types ---
type Tab = 'message' | 'prospect';
type MessageType = 'simple' | 'embed' | 'poll';

interface PollOption {
  id: string;
  text: string;
}

export default function ModeratorApp() {
  // --- Login State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Dashboard State ---
  const [activeTab, setActiveTab] = useState<Tab>('message');
  const [channels, setChannels] = useState<{id: string, name: string}[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  
  // --- Status/Feedback State ---
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- General Message State ---
  const [msgType, setMsgType] = useState<MessageType>('simple');
  const [content, setContent] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedColor, setEmbedColor] = useState('#DC2626');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: 'Yes' }, { id: '2', text: 'No' }
  ]);
  
  // --- Image Selection State ---
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);

  // --- Prospect State ---
  const [prospectName, setProspectName] = useState('');
  const [prospectDate, setProspectDate] = useState('');
  const [vetoEmoji, setVetoEmoji] = useState('⛔');

  // Helper: Clear status after 3 seconds
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Helper: Clear image/status when switching tabs
  useEffect(() => {
    setSelectedImagePath(null);
    setStatusMsg(null);
  }, [activeTab]);

  // --- LOGIN HANDLER ---
  const handleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);

    if (!(window as any).electronAPI) {
        if (tokenInput === 'test') {
            setIsLoggedIn(true);
            mockFetchChannels();
        } else {
            setLoginError("Preview Mode: Use password 'test'");
        }
        setIsLoggingIn(false);
        return;
    }

    try {
        const success = await (window as any).electronAPI.loginBot(tokenInput);
        if (success) {
            setIsLoggedIn(true);
            const chs = await (window as any).electronAPI.getChannels();
            setChannels(chs);
            if (chs.length > 0) setActiveChannelId(chs[0].id);
        } else {
            setLoginError('Invalid Bot Token. Please check and try again.');
        }
    } catch (e) {
        setLoginError('Connection failed.');
    }
    setIsLoggingIn(false);
  };

  const mockFetchChannels = () => {
      setChannels([
          { id: '1', name: 'general' },
          { id: '2', name: 'announcements' },
          { id: '3', name: 'prospect-reviews' }
      ]);
      setActiveChannelId('1');
  };

  // --- Image Handlers ---
  const handleSelectImage = async () => {
      if (!(window as any).electronAPI) return;
      const path = await (window as any).electronAPI.selectImage();
      if (path) {
          setSelectedImagePath(path);
      }
  };

  const handleClearImage = () => {
      setSelectedImagePath(null);
  };

  // --- Helpers ---
  const getDiscordTimestamp = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const unixTime = Math.floor(date.getTime() / 1000); 
    return `<t:${unixTime}:D>`;
  };

  const handleAddOption = () => {
    if (pollOptions.length < 10) setPollOptions([...pollOptions, { id: Math.random().toString(), text: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (pollOptions.length > 2) setPollOptions(pollOptions.filter(o => o.id !== id));
  };

  const handleOptionChange = (id: string, text: string) => {
    setPollOptions(pollOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  // --- Actions ---
  const handleSendMessage = async () => {
    if (!activeChannelId) {
        setStatusMsg({type: 'error', text: 'Please select a channel first.'});
        return;
    }

    setIsSending(true);
    setStatusMsg(null);
    
    if (!(window as any).electronAPI) { 
        alert("Preview mode: Message sent locally."); 
        setIsSending(false);
        return; 
    }
    
    const result = await (window as any).electronAPI.sendMessage({
      channelId: activeChannelId,
      type: msgType,
      content,
      embedData: { title: embedTitle, color: embedColor },
      pollOptions,
      imagePath: selectedImagePath
    });

    setIsSending(false);

    if (result.success) {
      setStatusMsg({type: 'success', text: 'Message Sent Successfully!'});
      setContent('');
      setEmbedTitle('');
      setSelectedImagePath(null);
    } else {
      setStatusMsg({type: 'error', text: 'Error: ' + result.error});
    }
  };

  const handleCreateThread = async () => {
    if (!prospectName || !prospectDate) {
        setStatusMsg({type: 'error', text: 'Please fill in name and date.'});
        return;
    }

    setIsSending(true);
    setStatusMsg(null);

    if (!(window as any).electronAPI) { 
        alert("Preview mode: Thread created locally."); 
        setIsSending(false);
        return; 
    }

    const timestampCode = getDiscordTimestamp(prospectDate);
    const messageContent = `**${prospectName}** prospect period will end in ${timestampCode}.\n\nIf you feel they should **NOT** become a WC member, you may exercise your veto using the react below (${vetoEmoji}), however please be prepared to explain your reasons for discussion.`;

    const result = await (window as any).electronAPI.createThread({
      channelId: activeChannelId,
      threadName: `Prospect Review: ${prospectName}`,
      content: messageContent,
      emoji: vetoEmoji,
      imagePath: selectedImagePath
    });

    setIsSending(false);

    if (result.success) {
      setStatusMsg({type: 'success', text: 'Thread Created Successfully!'});
      setProspectName('');
      setProspectDate('');
      setSelectedImagePath(null);
    } else {
      setStatusMsg({type: 'error', text: 'Error: ' + result.error});
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
      return (
        <div className="flex h-screen bg-[#121212] items-center justify-center font-sans text-red-50">
            <div className="bg-[#1e1e1e] p-8 rounded-lg border border-red-900/50 w-full max-w-md shadow-2xl shadow-red-900/20">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-black border-2 border-red-600 flex items-center justify-center overflow-hidden">
                        <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-red-50 mb-2">Wildcards Bot</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-red-300 uppercase mb-2 ml-1">Bot Token</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-red-700" size={18} />
                            <input 
                                type="password"
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                placeholder="Paste your discord bot token"
                                className="w-full bg-[#121212] text-red-50 p-3 pl-10 rounded border border-red-900/30 focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {loginError && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded text-sm border border-red-900/30">
                            <AlertCircle size={16} /> {loginError}
                        </div>
                    )}

                    <button 
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn ? 'Verifying...' : <><LogIn size={18} /> Access Dashboard</>}
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="flex h-screen bg-[#121212] font-sans text-red-50 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-[#1e1e1e] flex flex-col border-r border-red-900/50 shrink-0">
        <div className="p-4 border-b border-red-900/50 font-bold text-lg flex items-center gap-3">
           <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
           <span className="text-red-500">Admin Tool</span>
        </div>
        <div className="p-2 space-y-1">
          <button 
            onClick={() => setActiveTab('message')}
            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${activeTab === 'message' ? 'bg-red-900/40 text-white' : 'text-red-300 hover:bg-red-900/20'}`}
          >
            <MessageSquare size={18} /> General Message
          </button>
          <button 
            onClick={() => setActiveTab('prospect')}
            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${activeTab === 'prospect' ? 'bg-red-900/40 text-white' : 'text-red-300 hover:bg-red-900/20'}`}
          >
            <UserPlus size={18} /> Prospect Thread
          </button>
        </div>
        
        {/* Channel Selector */}
        <div className="mt-auto p-4 border-t border-red-900/50">
            <label className="text-xs font-bold text-red-300 uppercase mb-2 block">Target Channel</label>
            <select 
                value={activeChannelId}
                onChange={(e) => setActiveChannelId(e.target.value)}
                className="w-full bg-[#121212] p-2 rounded outline-none text-sm text-red-50 border border-red-900/30 focus:border-red-500 cursor-pointer"
            >
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="h-14 border-b border-red-900/50 flex items-center px-6 bg-[#121212] shrink-0">
          <Hash className="text-red-500 mr-2" size={20} />
          <span className="font-bold text-white">
            {channels.find(c => c.id === activeChannelId)?.name || 'Select Channel'}
          </span>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* INPUT FORM */}
            <div className="flex-1 p-6 overflow-y-auto text-red-50">
                
                {/* --- TAB 1: GENERAL MESSAGE --- */}
                {activeTab === 'message' && (
                    <div className="max-w-xl space-y-6">
                        {/* Type Selector */}
                        <div className="bg-[#1e1e1e] p-1 rounded-lg grid grid-cols-3 gap-1">
                            {(['simple', 'embed', 'poll'] as MessageType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setMsgType(t)}
                                    className={`flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-all capitalize ${msgType === t ? 'bg-red-900/40 text-white shadow' : 'text-red-300 hover:text-red-200 hover:bg-red-900/20'}`}
                                >
                                    {t === 'simple' ? <MessageSquare size={16}/> : t === 'embed' ? <Layout size={16}/> : <BarChart2 size={16}/>}
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Embed Options */}
                        {msgType === 'embed' && (
                            <div className="space-y-3 p-4 bg-[#1e1e1e] rounded border border-red-900/50">
                                <div>
                                    <label className="text-xs font-bold text-red-800 uppercase">Embed Title</label>
                                    <input 
                                        type="text" 
                                        value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)}
                                        className="w-full bg-[#121212] text-red-50 p-2 mt-1 rounded outline-none border border-red-900/30 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-300 uppercase">Color</label>
                                    <input 
                                        type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)}
                                        className="block w-full h-8 mt-1 rounded cursor-pointer border border-red-900/30"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content Box */}
                        <div>
                            <label className="text-xs font-bold text-red-300 uppercase">
                                {msgType === 'poll' ? 'Poll Question' : 'Content'}
                            </label>
                            <textarea
                                value={content} onChange={(e) => setContent(e.target.value)}
                                disabled={isSending}
                                placeholder={msgType === 'poll' ? "" : ""}
                                className="w-full bg-[#121212] text-red-50 p-3 mt-1 rounded h-32 outline-none border border-red-900/30 focus:border-red-500 resize-none placeholder-red-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* MESSAGE IMAGE UPLOAD SECTION */}
                        <div className="border border-dashed border-red-900/50 rounded p-4 flex flex-col items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-red-900/10 transition-colors">
                            {selectedImagePath ? (
                                <div className="flex items-center gap-2 bg-red-900/20 px-3 py-2 rounded border border-red-900/30 w-full justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <ImageIcon size={16} className="text-red-400 shrink-0"/>
                                        <span className="text-sm text-red-200 truncate" title={selectedImagePath}>
                                            ...{selectedImagePath.slice(-25)}
                                        </span>
                                    </div>
                                    <button onClick={handleClearImage} className="text-red-400 hover:text-white shrink-0">
                                        <X size={16}/>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleSelectImage} 
                                    className="text-sm text-red-400 hover:text-red-200 flex items-center gap-2 w-full justify-center h-full py-2"
                                >
                                    <Plus size={16}/> Attach Image
                                </button>
                            )}
                        </div>

                        {/* Poll Options */}
                        {msgType === 'poll' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-red-300 uppercase">Options</label>
                                {pollOptions.map((opt, idx) => (
                                    <div key={opt.id} className="flex gap-2">
                                        <input 
                                            value={opt.text} onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                                            placeholder={`Option ${idx+1}`}
                                            className="flex-1 bg-[#121212] text-red-50 p-2 rounded outline-none border border-red-900/30 focus:border-red-500 placeholder-red-300/50"
                                        />
                                        {pollOptions.length > 2 && (
                                            <button onClick={() => handleRemoveOption(opt.id)} className="p-2 text-red-500 hover:bg-red-900/30 rounded"><Trash2 size={16}/></button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < 10 && (
                                    <button onClick={handleAddOption} className="text-sm text-red-400 hover:underline flex items-center gap-1"><Plus size={14}/> Add Option</button>
                                )}
                            </div>
                        )}
                        
                        {/* Status Message Display */}
                        {statusMsg && (
                            <div className={`p-3 rounded text-sm flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-red-900/20 text-red-400 border border-red-900/30'}`}>
                                {statusMsg.type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>}
                                {statusMsg.text}
                            </div>
                        )}

                        <button 
                            onClick={handleSendMessage}
                            disabled={isSending} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18}/>}
                            {isSending ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                )}

                {/* --- TAB 2: PROSPECT THREAD --- */}
                {activeTab === 'prospect' && (
                    <div className="max-w-xl space-y-6">
                         <div className="bg-[#1e1e1e] p-6 rounded-lg border border-red-900/50 shadow-lg shadow-red-900/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                                <UserPlus size={24}/> New Prospect
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-red-300 uppercase">Prospect Name</label>
                                    <input 
                                        value={prospectName} onChange={(e) => setProspectName(e.target.value)}
                                        placeholder=""
                                        className="w-full bg-[#121212] text-red-50 p-3 mt-1 rounded outline-none border border-red-900/30 focus:border-red-500 placeholder-red-300/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-300 uppercase">End Date</label>
                                    <input 
                                        type="date" 
                                        value={prospectDate} onChange={(e) => setProspectDate(e.target.value)}
                                        className="w-full bg-[#121212] text-red-50 p-3 mt-1 rounded outline-none border border-red-900/30 focus:border-red-500 scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-300 uppercase">Veto Emoji</label>
                                    <div className="flex gap-2 mt-1">
                                        {['❌',].map(em => (
                                            <button 
                                                key={em} 
                                                onClick={() => setVetoEmoji(em)}
                                                className={`p-2 rounded text-xl transition-all ${vetoEmoji === em ? 'bg-red-500/20 border border-red-500' : 'bg-[#121212] border border-transparent hover:bg-red-900/20'}`}
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PROSPECT IMAGE UPLOAD SECTION */}
                            <div className="mt-4">
                                <label className="text-xs font-bold text-red-300 uppercase mb-2 block">Attach Prospect Image</label>
                                <div className="border border-dashed border-red-900/50 rounded p-4 flex flex-col items-center justify-center gap-2 bg-[#121212] hover:bg-red-900/10 transition-colors">
                                    {selectedImagePath ? (
                                        <div className="flex items-center gap-2 bg-red-900/20 px-3 py-2 rounded border border-red-900/30 w-full justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <ImageIcon size={16} className="text-red-400 shrink-0"/>
                                                <span className="text-sm text-red-200 truncate" title={selectedImagePath}>
                                                    ...{selectedImagePath.slice(-25)}
                                                </span>
                                            </div>
                                            <button onClick={handleClearImage} className="text-red-400 hover:text-white shrink-0">
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleSelectImage} 
                                            className="text-sm text-red-400 hover:text-red-200 flex items-center gap-2 w-full justify-center h-full py-2"
                                        >
                                            <Plus size={16}/> Upload Image
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Status Message Display */}
                            {statusMsg && (
                                <div className={`mt-4 p-3 rounded text-sm flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-red-900/20 text-red-400 border border-red-900/30'}`}>
                                    {statusMsg.type === 'success' ? <Check size={16}/> : <AlertCircle size={16}/>}
                                    {statusMsg.text}
                                </div>
                            )}

                            <button 
                                onClick={handleCreateThread} 
                                disabled={isSending}
                                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18}/>}
                                {isSending ? 'Creating...' : 'Create Thread'}
                            </button>
                         </div>
                    </div>
                )}
            </div>

            {/* PREVIEW PANE */}
            <div className="w-96 bg-[#121212] border-l border-red-900/50 p-6 hidden md:block overflow-y-auto">
                <h3 className="text-red-300 text-xs font-bold uppercase mb-4 tracking-wide">Preview</h3>
                
                {/* PREVIEW MESSAGE CONTAINER */}
                <div className="group flex gap-3 hover:bg-red-900/10 -mx-2 p-2 rounded transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white shrink-0 text-sm">BOT</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-red-500">Wildcards Bot</span>
                            <span className="bg-red-600 text-white text-[10px] px-1 rounded uppercase font-bold">APP</span>
                            <span className="text-xs text-red-300/70">Today at 4:20 PM</span>
                        </div>

                        {/* RENDER LOGIC */}
                        <div className="text-red-50 mt-1 whitespace-pre-wrap text-[15px] leading-snug">
                            {activeTab === 'message' && msgType === 'simple' && (content || <span className="text-red-300/60 italic"></span>)}
                            
                            {/* Embed Preview */}
                            {activeTab === 'message' && msgType === 'embed' && (
                                <div className="flex mt-1 flex-col gap-2">
                                    <div className="flex">
                                        <div className="w-1 rounded-l shrink-0" style={{ backgroundColor: embedColor }}></div>
                                        <div className="bg-[#1e1e1e] rounded-r p-3 max-w-full w-full border border-red-900/50">
                                            <div className="font-bold text-white mb-1">{embedTitle || 'Embed Title'}</div>
                                            <div className="text-sm text-red-200">{content || 'Embed description...'}</div>
                                            
                                            {/* Preview Selected Image inside Embed */}
                                            {selectedImagePath && (
                                                <div className="mt-3 rounded overflow-hidden border border-red-900/30">
                                                    <div className="bg-red-900/10 h-32 flex items-center justify-center text-red-400 text-xs">
                                                        [Image Attached]
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Simple Message Image Preview */}
                            {activeTab === 'message' && msgType === 'simple' && selectedImagePath && (
                                <div className="mt-2 w-48 h-32 bg-red-900/10 rounded border border-red-900/30 flex items-center justify-center text-red-400 text-xs">
                                    [Image Attached]
                                </div>
                            )}

                            {/* Poll Preview */}
                            {activeTab === 'message' && msgType === 'poll' && (
                                <div className="bg-[#1e1e1e] rounded p-3 mt-1 border border-red-900/50">
                                    <div className="font-bold text-white mb-2">{content || 'Poll Question?'}</div>
                                    <div className="space-y-1">
                                        {pollOptions.map(o => (
                                            <div key={o.id} className="bg-[#121212] p-2 rounded text-sm flex justify-between border border-red-900/30">
                                                <span>{o.text || 'Option'}</span>
                                                <div className="w-4 h-4 border border-red-500 rounded-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedImagePath && (
                                        <div className="mt-2 text-xs text-red-400 italic">[Image will follow poll]</div>
                                    )}
                                </div>
                            )}

                            {/* Prospect Preview */}
                            {activeTab === 'prospect' && (
                                <div>
                                    <div className="mb-3">
                                        <img src={judgeImage} alt='Judging' className="full border-red-900/40 rounded px-1" />
                                    </div>
                                
                                    <div>
                                        <strong>{prospectName || 'Name'}</strong> prospect period will end in <span className="bg-red-900/40 rounded px-1">{prospectDate ? new Date(prospectDate).toLocaleDateString() : 'Date'}</span>.
                                        <br/><br/>
                                        If you feel they should <strong>NOT</strong> become a WC member, you may exercise your veto using the react below ({vetoEmoji}), however please be prepared to explain your reasons for discussion.
                                    </div>
                                    
                                    {/* Prospect Image Preview */}
                                    {selectedImagePath && (
                                        <div className="mt-2 w-full h-32 bg-black/40 rounded border border-red-900/30 flex items-center justify-center text-red-400 text-xs">
                                            [Image Attached]
                                        </div>
                                    )}

                                    <div className="mt-2 flex gap-1">
                                        <div className="bg-[#1e1e1e] border border-red-900/50 px-2 py-0.5 rounded flex items-center gap-1.5 text-sm text-red-300">
                                            {vetoEmoji} <span className="text-xs font-bold">1</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
