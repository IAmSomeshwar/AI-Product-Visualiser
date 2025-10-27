import React, { useState, useRef, useMemo } from 'react';
import { MarketingMedium, MediumInfo } from './types';
import { generateVisual, removeBackground } from './services/geminiService';
import { 
  BillboardIcon, MugIcon, TShirtIcon, ToteBagIcon, PhoneCaseIcon, SocialMediaPostIcon, 
  CameraIcon, ScissorsIcon, XMarkIcon, ShareIcon, UndoIcon, RefreshIcon 
} from './components/icons';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [originalImageBeforeBgRemove, setOriginalImageBeforeBgRemove] = useState<string | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = useState<boolean>(false);
  const [selectedMedium, setSelectedMedium] = useState<MarketingMedium>(MarketingMedium.Mug);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [prompt, setPrompt] = useState<string>('');
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const marketingMedia: MediumInfo[] = useMemo(() => [
    { id: MarketingMedium.Mug, label: 'Mug', icon: MugIcon, prompt: 'A product photo of the subject from the provided image on a white coffee mug. The mug is on a clean, modern kitchen counter with soft, natural lighting.' },
    { id: MarketingMedium.Billboard, label: 'Billboard', icon: BillboardIcon, prompt: 'A high-resolution photo of the subject from the provided image on a massive billboard in a bustling city square like Times Square. The lighting is bright and eye-catching.' },
    { id: MarketingMedium.TShirt, label: 'T-Shirt', icon: TShirtIcon, prompt: 'A lifestyle photo of a person wearing a plain t-shirt with the subject from the provided image prominently displayed on the chest. The setting is a casual, urban environment.' },
    { id: MarketingMedium.ToteBag, label: 'Tote Bag', icon: ToteBagIcon, prompt: 'A photo of the subject from the provided image on a canvas tote bag. The bag is held by a person walking through a vibrant, outdoor market.' },
    { id: MarketingMedium.PhoneCase, label: 'Phone Case', icon: PhoneCaseIcon, prompt: 'A close-up shot of the subject from the provided image on a sleek, modern phone case. The phone is being held in a hand, with a blurred, stylish background.' },
    { id: MarketingMedium.SocialMediaPost, label: 'Social Media Post', icon: SocialMediaPostIcon, prompt: 'A visually appealing social media post mockup featuring the subject from the provided image. The design is trendy and optimized for platforms like Instagram, with engaging graphics and a call-to-action.' },
  ], []);

  const aspectRatios = [
    { id: '1:1', label: 'Square' },
    { id: '4:3', label: 'Landscape' },
    { id: '3:4', label: 'Portrait' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState();
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setSelectedFrame(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setSelectedFrame(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedFrame) {
      setError('Please select an image or capture a frame first.');
      return;
    }
    
    const [header, base64Data] = selectedFrame.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    const currentPrompt = prompt || marketingMedia.find(m => m.id === selectedMedium)?.prompt || '';
    const fullPrompt = `${currentPrompt} The final image must have a ${aspectRatio} aspect ratio.`;


    setIsLoading(true);
    setError(null);
    setGeneratedVisual(null);

    try {
      const result = await generateVisual(base64Data, mimeType, fullPrompt);
      setGeneratedVisual(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveBackground = async () => {
    if (!selectedFrame) {
      setError('Please select an image first.');
      return;
    }
    
    const [header, base64Data] = selectedFrame.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    setIsLoading(true);
    setError(null);
    setOriginalImageBeforeBgRemove(selectedFrame); // Save current state for undo

    try {
      const result = await removeBackground(base64Data, mimeType);
      setSelectedFrame(`data:image/png;base64,${result}`);
      setBackgroundRemoved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while removing background.');
      setOriginalImageBeforeBgRemove(null); // Clear undo state on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndoRemoveBackground = () => {
    if (originalImageBeforeBgRemove) {
      setSelectedFrame(originalImageBeforeBgRemove);
      setOriginalImageBeforeBgRemove(null);
      setBackgroundRemoved(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setSelectedFrame(null);
    setGeneratedVisual(null);
    setError(null);
    setPrompt('');
    setIsLoading(false);
    setBackgroundRemoved(false);
    setOriginalImageBeforeBgRemove(null);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
      const arr = dataurl.split(',');
      if (arr.length < 2) { return null; }
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) { return null; }
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
  }

  const handleShare = async () => {
    if (!generatedVisual) return;
    try {
      const file = dataURLtoFile(generatedVisual, 'generated-visual.png');
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'AI Product Visual',
          text: 'Check out this product visual I created!',
          files: [file],
        });
      } else {
        // Fallback for browsers that don't support sharing files
        const link = document.createElement('a');
        link.href = generatedVisual;
        link.download = 'generated-visual.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setError('Could not share the image. You can try downloading it instead.');
    }
  };


  const renderFilePreview = () => {
    if (!selectedFile || selectedFrame) return null;
    
    if (selectedFile.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(selectedFile)} alt="Selected" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />;
    }
    
    if (selectedFile.type.startsWith('video/')) {
      return (
        <video ref={videoRef} controls className="max-h-full max-w-full rounded-lg shadow-lg">
          <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
          Your browser does not support the video tag.
        </video>
      );
    }
    
    return <p>Unsupported file type</p>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">AI Product Visualizer</h1>
        <p className="text-lg text-gray-400 mt-2">Generate stunning marketing visuals for your products in seconds.</p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input and Customization */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col space-y-6">
          
          <div>
            <label htmlFor="file-upload" className="text-lg font-semibold text-gray-300 mb-2 block">1. Upload Your Product Image or Video</label>
            <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-gray-600 px-6 py-10 hover:border-purple-400 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-purple-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-purple-300">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF, MP4, MOV up to 10MB</p>
              </div>
            </div>
          </div>
          
          {selectedFile && !selectedFrame && (
            <div className="relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              {renderFilePreview()}
            </div>
          )}

          {selectedFrame && (
            <div className="flex flex-col space-y-4">
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center p-2">
                 <img src={selectedFrame} alt="Selected frame" className="max-h-full max-w-full object-contain rounded-md" />
                 <button onClick={resetState} className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-white hover:bg-gray-800/80 transition-colors">
                   <XMarkIcon className="h-5 w-5"/>
                 </button>
              </div>
              
              <div className="flex space-x-2">
                 {!backgroundRemoved ? (
                    <button onClick={handleRemoveBackground} disabled={isLoading} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors">
                      <ScissorsIcon className="w-5 h-5 mr-2"/> Remove Background
                    </button>
                  ) : (
                    <button onClick={handleUndoRemoveBackground} disabled={isLoading} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                      <UndoIcon className="w-5 h-5 mr-2"/> Undo
                    </button>
                  )}
              </div>

            </div>
          )}

          {selectedFile && selectedFile.type.startsWith('video/') && !selectedFrame && (
            <button onClick={handleCaptureFrame} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <CameraIcon className="w-5 h-5 mr-2" /> Capture Frame
            </button>
          )}

          {selectedFrame && (
            <>
              <div>
                <label htmlFor="medium" className="text-lg font-semibold text-gray-300 mb-3 block">2. Choose a Medium</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {marketingMedia.map((medium) => (
                    <button
                      key={medium.id}
                      onClick={() => setSelectedMedium(medium.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${selectedMedium === medium.id ? 'bg-purple-600 border-purple-400' : 'bg-gray-700 border-gray-600 hover:border-purple-500'}`}
                      aria-label={`Select ${medium.label}`}
                    >
                      <medium.icon className="w-8 h-8 mb-1" />
                      <span className="text-xs text-center">{medium.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-lg font-semibold text-gray-300 mb-3 block">3. Select Aspect Ratio</label>
                <div className="flex space-x-3">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.id}
                      onClick={() => setAspectRatio(ar.id)}
                      className={`flex-1 p-2 rounded-lg border-2 text-sm font-semibold transition-colors ${aspectRatio === ar.id ? 'bg-purple-600 border-purple-400' : 'bg-gray-700 border-gray-600 hover:border-purple-500'}`}
                    >
                      {ar.label} ({ar.id})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="prompt" className="text-lg font-semibold text-gray-300 mb-2 block">4. (Optional) Customize with a Prompt</label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-sm placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={marketingMedia.find(m => m.id === selectedMedium)?.prompt}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : '✨ Generate Visual'}
              </button>
            </>
          )}

        </div>

        {/* Right Column: Output */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center min-h-[400px] lg:min-h-0">
          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
          
          {isLoading && !generatedVisual && (
            <div className="text-center text-gray-400">
              <svg className="animate-spin mx-auto h-10 w-10 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="font-semibold text-lg">Generating your visual...</p>
              <p>This may take a moment.</p>
            </div>
          )}

          {!isLoading && !generatedVisual && (
            <div className="text-center text-gray-500">
              <p className="text-xl">Your generated visual will appear here.</p>
            </div>
          )}
          
          {generatedVisual && (
            <div className="w-full h-full relative group">
              <img src={generatedVisual} alt="Generated visual" className="w-full h-full object-contain rounded-lg" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={handleGenerate} disabled={isLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50">
                   <RefreshIcon className="w-5 h-5 mr-2" /> Regenerate
                 </button>
                 <button onClick={handleShare} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                   <ShareIcon className="w-5 h-5 mr-2" /> Share
                 </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
