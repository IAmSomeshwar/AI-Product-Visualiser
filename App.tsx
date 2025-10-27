
import React, { useState, useCallback } from 'react';
import { MarketingMedium, MediumInfo } from './types';
import { generateVisual } from './services/geminiService';
import {
  UploadIcon,
  MugIcon,
  BillboardIcon,
  TShirtIcon,
  WandIcon,
} from './components/icons';

type ProductImage = {
  base64: string;
  mimeType: string;
  name: string;
};

const mediaOptions: MediumInfo[] = [
  {
    id: MarketingMedium.Mug,
    label: 'Mug',
    icon: MugIcon,
    prompt:
      'A photorealistic, high-quality product shot of this item seamlessly printed on a glossy white coffee mug. The mug is sitting on a rustic wooden cafe table, with soft, natural morning light. The background is slightly blurred to emphasize the mug.',
  },
  {
    id: MarketingMedium.Billboard,
    label: 'Billboard',
    icon: BillboardIcon,
    prompt:
      'A photorealistic image of a massive, modern billboard in a bustling city square like Times Square at dusk. This item is the central focus of the billboard advertisement. The city lights should reflect off the billboard surface.',
  },
  {
    id: MarketingMedium.TShirt,
    label: 'T-Shirt',
    icon: TShirtIcon,
    prompt:
      'A photorealistic image of a person wearing a plain, high-quality cotton t-shirt (color: heather grey). This item is featured as a crisp, clear graphic print on the center of the t-shirt. The photo is taken from the chest up, in a well-lit studio environment.',
  },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// -- Reusable Components defined outside App to prevent re-creation on re-renders --

interface ImageUploaderProps {
  onImageUpload: (image: ProductImage) => void;
  productImage: ProductImage | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, productImage }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      onImageUpload({ base64, mimeType: file.type, name: file.name });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Product Image</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
          <div className="flex text-sm text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500"
            >
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">{productImage ? productImage.name : 'PNG, JPG, GIF up to 10MB'}</p>
        </div>
      </div>
    </div>
  );
};


interface MediumSelectorProps {
  selectedMedium: MarketingMedium | null;
  onSelectMedium: (medium: MarketingMedium) => void;
  disabled: boolean;
}

const MediumSelector: React.FC<MediumSelectorProps> = ({ selectedMedium, onSelectMedium, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">2. Choose a Medium</label>
        <div className={`grid grid-cols-3 gap-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {mediaOptions.map((medium) => (
            <button
            key={medium.id}
            onClick={() => onSelectMedium(medium.id)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${
                selectedMedium === medium.id
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
            }`}
            >
            <medium.icon className="h-8 w-8 mb-2" />
            <span className="text-sm font-semibold">{medium.label}</span>
            </button>
        ))}
        </div>
    </div>
);

interface GeneratedImageDisplayProps {
    generatedImage: string | null;
    isLoading: boolean;
    productImage: ProductImage | null;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ generatedImage, isLoading, productImage }) => {
    return (
        <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-center min-h-[300px] md:min-h-full shadow-inner">
            {isLoading ? (
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-dashed border-indigo-400 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-400">Generating your visual... please wait.</p>
                </div>
            ) : generatedImage ? (
                <img src={`data:image/png;base64,${generatedImage}`} alt="Generated visual" className="max-w-full max-h-full object-contain rounded-md" />
            ) : (
                <div className="text-center text-gray-500">
                    <WandIcon className="mx-auto h-16 w-16" />
                    <p className="mt-2 text-lg">Your generated image will appear here</p>
                    <p className="text-sm">{productImage ? 'Ready to generate.' : 'Upload an image to start.'}</p>
                </div>
            )}
        </div>
    );
}


// -- Main App Component --

export default function App() {
  const [productImage, setProductImage] = useState<ProductImage | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<MarketingMedium | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlsDisabled = !productImage;

  const handleImageUpload = (image: ProductImage) => {
    setProductImage(image);
    setSelectedMedium(null);
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
  };

  const handleSelectMedium = (mediumId: MarketingMedium) => {
    setSelectedMedium(mediumId);
    const mediumInfo = mediaOptions.find((m) => m.id === mediumId);
    if (mediumInfo) {
      setPrompt(mediumInfo.prompt);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!productImage || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateVisual(productImage.base64, productImage.mimeType, prompt);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [productImage, prompt]);

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-3">
            <WandIcon className="h-7 w-7 text-indigo-400" />
            <span>AI Product Visualizer</span>
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Controls */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <ImageUploader onImageUpload={handleImageUpload} productImage={productImage} />
            </div>

            <div className={`bg-gray-800 p-6 rounded-lg shadow-lg transition-opacity duration-300 ${controlsDisabled ? 'opacity-50' : 'opacity-100'}`}>
                <MediumSelector selectedMedium={selectedMedium} onSelectMedium={handleSelectMedium} disabled={controlsDisabled} />
            </div>
            
            <div className={`bg-gray-800 p-6 rounded-lg shadow-lg transition-opacity duration-300 ${controlsDisabled ? 'opacity-50' : 'opacity-100'}`}>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">3. Edit or Refine Prompt</label>
              <textarea
                id="prompt"
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={controlsDisabled}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed"
                placeholder="Select a medium to get a starter prompt, or write your own..."
              />
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
                <p><span className="font-bold">Error:</span> {error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={controlsDisabled || isLoading || !prompt}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 text-lg shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <WandIcon className="h-6 w-6" />
                  <span>Generate Visual</span>
                </>
              )}
            </button>
          </div>
          
          {/* Right Panel: Display */}
          <div className="row-start-1 lg:col-start-2">
            <GeneratedImageDisplay generatedImage={generatedImage} isLoading={isLoading} productImage={productImage} />
          </div>
        </div>
      </main>
    </div>
  );
}
